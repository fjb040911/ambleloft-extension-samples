// Local business simulator, separate from the host and excluded from extension packages.
const http = require('node:http'),
  { DatabaseSync } = require('node:sqlite');
function createService({ database = 'actions.sqlite', port = 47833 } = {}) {
  const db = new DatabaseSync(database);
  db.exec('CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,state TEXT NOT NULL);');
  let writes = 0;
  const server = http.createServer(async (req, res) => {
    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 4096) throw Error('size');
      }
      const input = raw ? JSON.parse(raw) : {},
        url = new URL(req.url, 'http://127.0.0.1');
      let result;
      if (req.method === 'POST' && url.pathname === '/tasks') {
        if (typeof input.id !== 'string' || input.id.length > 200) throw Error('id');
        const prior = db.prepare('SELECT * FROM tasks WHERE id=?').get(input.id);
        if (!prior) {
          db.prepare('INSERT INTO tasks VALUES (?,?)').run(
            input.id,
            input.mode === 'unknown' ? 'completed' : 'accepted',
          );
          writes++;
        }
        if (input.mode === 'unknown') {
          req.socket.destroy();
          return;
        }
        result = db.prepare('SELECT * FROM tasks WHERE id=?').get(input.id);
      } else if (req.method === 'POST' && url.pathname === '/complete') {
        db.prepare("UPDATE tasks SET state='completed' WHERE id=?").run(input.id);
        result = { completed: true };
      } else if (req.method === 'GET' && url.pathname.startsWith('/tasks/'))
        result = db
          .prepare('SELECT * FROM tasks WHERE id=?')
          .get(decodeURIComponent(url.pathname.slice(7))) || { state: 'unknown' };
      else if (req.method === 'GET' && url.pathname === '/ledger')
        result = { writes, tasks: db.prepare('SELECT * FROM tasks').all() };
      else {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch {
      res.writeHead(400);
      res.end('{}');
    }
  });
  return {
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
  const s = createService();
  s.listen().then((port) => console.log('Local action service http://127.0.0.1:' + port));
  for (const event of ['SIGINT', 'SIGTERM'])
    process.on(event, () => s.close().then(() => process.exit()));
}
