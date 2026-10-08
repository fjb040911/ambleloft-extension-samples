'use strict';
const http = require('node:http');
const { DatabaseSync } = require('node:sqlite');
const { createHash, randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const stable = (v) =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(
        Object.keys(v)
          .sort()
          .map((k) => [k, stable(v[k])]),
      )
    : v;
function createService({ database, port = 47832 } = {}) {
  fs.mkdirSync(path.dirname(database), { recursive: true });
  const db = new DatabaseSync(database);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS submissions(tenant TEXT,operation TEXT,id TEXT,digest TEXT,input TEXT,status TEXT,result TEXT,PRIMARY KEY(tenant,operation,id));
 CREATE TABLE IF NOT EXISTS traces(tenant TEXT,operation TEXT,id TEXT,context TEXT,PRIMARY KEY(tenant,operation,id));
 CREATE TABLE IF NOT EXISTS drafts(id TEXT PRIMARY KEY,region TEXT,date TEXT);
 CREATE TABLE IF NOT EXISTS expenses(id TEXT PRIMARY KEY,draftId TEXT UNIQUE,amount TEXT,remark TEXT);
 `);
  let modes = {},
    queryFailure = false,
    invalidResult = false;
  const tenant = 'local-demo-tenant';
  const transaction = (fn) => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const value = fn();
      db.exec('COMMIT');
      return value;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  };
  const row = (op, id) =>
    db
      .prepare('SELECT * FROM submissions WHERE tenant=? AND operation=? AND id=?')
      .get(tenant, op, id);
  function finish(op, id) {
    return transaction(() => {
      const r = row(op, id);
      if (!r || r.status !== 'pending') return r;
      const input = JSON.parse(r.input);
      let result;
      if (op === 'saveDraft') {
        const draftId = randomUUID();
        db.prepare('INSERT INTO drafts VALUES(?,?,?)').run(draftId, input.region, input.date);
        result = { draftId };
      } else {
        const old = db.prepare('SELECT * FROM expenses WHERE draftId=?').get(input.draftId);
        if (old) {
          if (old.amount !== input.amount || old.remark !== input.remark)
            throw Object.assign(Error('Draft already submitted with different values'), {
              status: 409,
            });
          result = { expenseId: old.id, status: 'submitted' };
        } else {
          if (!db.prepare('SELECT id FROM drafts WHERE id=?').get(input.draftId))
            throw Object.assign(Error('Unknown draft'), { status: 400 });
          const expenseId = randomUUID();
          db.prepare('INSERT INTO expenses VALUES(?,?,?,?)').run(
            expenseId,
            input.draftId,
            input.amount,
            input.remark,
          );
          result = { expenseId, status: 'submitted' };
        }
      }
      db.prepare(
        "UPDATE submissions SET status='succeeded',result=? WHERE tenant=? AND operation=? AND id=?",
      ).run(JSON.stringify(result), tenant, op, id);
      return row(op, id);
    });
  }
  function validate(op, input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid input');
    if (op === 'saveDraft') {
      if (
        !['shanghai', 'beijing'].includes(input.region) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
        !Number.isFinite(Date.parse(input.date)) ||
        new Date(input.date).toISOString().slice(0, 10) !== input.date
      )
        throw Error('Invalid itinerary');
    } else if (op === 'submitExpense') {
      if (
        typeof input.draftId !== 'string' ||
        typeof input.amount !== 'string' ||
        !/^\d+\.\d{2}$/.test(input.amount) ||
        BigInt(input.amount.replace('.', '')) < 1n ||
        BigInt(input.amount.replace('.', '')) > 100000000n ||
        typeof input.remark !== 'string' ||
        input.remark.length > 2000 ||
        input.confirmed !== true
      )
        throw Error('Invalid expense');
    } else throw Error('Invalid operation');
  }
  const server = http.createServer(async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(data));
    };
    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 65536) throw Error('Request too large');
      }
      const body = raw ? JSON.parse(raw) : {};
      if (req.method === 'GET' && req.url === '/ledger') {
        send(200, {
          version: '0.1.0',
          tenant,
          counts: {
            drafts: db.prepare('SELECT count(*) n FROM drafts').get().n,
            expenses: db.prepare('SELECT count(*) n FROM expenses').get().n,
          },
          traces: db
            .prepare('SELECT operation,id,context FROM traces')
            .all()
            .map((r) => ({ ...r, context: JSON.parse(r.context) })),
          submissions: db
            .prepare('SELECT operation,id,status,result FROM submissions')
            .all()
            .map((r) => ({ ...r, result: r.result ? JSON.parse(r.result) : null })),
        });
        return;
      }
      if (req.method === 'POST' && req.url === '/control') {
        if (body.mode) modes[body.operation || 'saveDraft'] = body.mode;
        if (typeof body.queryFailure === 'boolean') queryFailure = body.queryFailure;
        if (typeof body.invalidResult === 'boolean') invalidResult = body.invalidResult;
        if (body.release) {
          const r = finish(body.operation, body.release);
          send(200, { status: r?.status || 'unknown' });
          return;
        }
        if (body.cancel)
          transaction(() => {
            db.prepare(
              "UPDATE submissions SET status='notExecuted' WHERE tenant=? AND operation=? AND id=? AND status='pending'",
            ).run(tenant, body.operation, body.cancel);
          });
        send(200, { ok: true });
        return;
      }
      if (req.method !== 'POST') {
        send(404, { error: 'not found' });
        return;
      }
      const op = body.operation,
        id = body.submissionId;
      if (
        !['saveDraft', 'submitExpense'].includes(op) ||
        typeof id !== 'string' ||
        !id.length ||
        id.length > 200
      )
        throw Error('Invalid submission');
      if (req.url === '/lookup') {
        if (queryFailure) {
          send(503, { error: 'injected query failure' });
          return;
        }
        const r = row(op, id);
        send(
          200,
          r?.status === 'succeeded'
            ? {
                status: 'succeeded',
                result: invalidResult ? { invalid: true } : JSON.parse(r.result),
              }
            : { status: r?.status === 'notExecuted' ? 'notExecuted' : 'unknown' },
        );
        return;
      }
      if (req.url !== '/write') {
        send(404, { error: 'not found' });
        return;
      }
      validate(op, body.input);
      const digest = createHash('sha256')
        .update(JSON.stringify(stable(body.input)))
        .digest('hex');
      const mode = modes[op] || 'normal';
      const r = transaction(() => {
        const old = row(op, id);
        if (old) {
          if (old.digest !== digest)
            throw Object.assign(Error('Idempotency key input conflict'), { status: 409 });
          return old;
        }
        db.prepare('INSERT INTO submissions VALUES(?,?,?,?,?,?,?)').run(
          tenant,
          op,
          id,
          digest,
          JSON.stringify(body.input),
          mode === 'reject' || mode === 'cancel' ? 'notExecuted' : 'pending',
          null,
        );
        if (body.trace) {
          const trace = Object.fromEntries(
            [
              'flowInstanceId',
              'stepId',
              'submissionId',
              'templateDigest',
              'conversationId',
              'requestId',
              'caller',
            ]
              .filter((k) => typeof body.trace[k] === 'string' && body.trace[k].length <= 200)
              .map((k) => [k, body.trace[k]]),
          );
          db.prepare('INSERT INTO traces VALUES(?,?,?,?)').run(
            tenant,
            op,
            id,
            JSON.stringify(trace),
          );
        }
        return row(op, id);
      });
      if (r.status === 'notExecuted') {
        send(409, { status: 'notExecuted' });
        return;
      }
      if (r.status === 'succeeded') {
        send(200, JSON.parse(r.result));
        return;
      }
      if (mode === 'hold') {
        send(202, { status: 'unknown' });
        return;
      }
      const done = finish(op, id);
      if (mode === 'drop') {
        req.socket.destroy();
        return;
      }
      send(200, JSON.parse(done.result));
    } catch (e) {
      send(e.status || 400, { error: e.message });
    }
  });
  return {
    server,
    listen: () =>
      new Promise((resolve) =>
        server.listen(port, '127.0.0.1', () => resolve(server.address().port)),
      ),
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(() => {
          db.close();
          resolve();
        });
      }),
  };
}
module.exports = { createService };
if (require.main === module) {
  const service = createService({
    database: path.resolve(process.env.EXPENSE_DB || './expense-data/ledger.sqlite'),
    port: Number(process.env.PORT || 47832),
  });
  service
    .listen()
    .then((port) => console.log(`Mock expense service 0.1.0 http://127.0.0.1:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => service.close().then(() => process.exit(0)));
}
