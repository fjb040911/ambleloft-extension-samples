const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createService } = require('../mock-service/server.cjs');
test(
  'durable claims: duplicates, dropped responses, pending restart and cancellation fence',
  { timeout: 20000 },
  async (t) => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sample-expense-'));
    let service, port;
    const start = async () => {
      service = createService({ database: path.join(dir, 'ledger.sqlite'), port: 0 });
      port = await service.listen();
    };
    t.after(async () => {
      await service?.close();
      await fs.rm(dir, { recursive: true, force: true });
    });
    await start();
    const get = async (route) => (await fetch(`http://127.0.0.1:${port}${route}`)).json();
    const post = async (route, body) => {
      const r = await fetch(`http://127.0.0.1:${port}${route}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(4000),
      });
      return { code: r.status, value: await r.json() };
    };
    const control = (body) => post('/control', body),
      write = (operation, submissionId, input) =>
        post('/write', { operation, submissionId, input }),
      lookup = (operation, submissionId) => post('/lookup', { operation, submissionId });
    assert.equal((await get('/health')).connected, true);
    const itinerary = { region: 'shanghai', date: '2026-10-08' };
    assert.equal((await write('saveDraft', 'bad', { ...itinerary, date: '2026-02-30' })).code, 400);
    const draft = await write('saveDraft', 'draft', itinerary);
    assert.equal(draft.code, 200);
    assert.deepEqual(await write('saveDraft', 'draft', itinerary), draft);
    assert.equal(
      (await write('saveDraft', 'draft', { ...itinerary, region: 'beijing' })).code,
      409,
    );
    const claim = {
      draftId: draft.value.draftId,
      amount: '1280.00',
      remark: '高铁680 + 酒店600',
      confirmed: true,
    };
    for (const amount of ['0.00', '-1.00', '1.234', '1000000.01'])
      assert.equal((await write('submitExpense', 'bad-' + amount, { ...claim, amount })).code, 400);
    assert.equal((await write('submitExpense', 'empty', { ...claim, remark: ' ' })).code, 400);
    await control({ operation: 'submitExpense', mode: 'drop' });
    await assert.rejects(write('submitExpense', 'claim', claim));
    const recovered = await lookup('submitExpense', 'claim');
    assert.equal(recovered.value.status, 'succeeded');
    await assert.rejects(write('submitExpense', 'claim2', claim));
    // Above response may be dropped for a new submission key after the same business result.
    assert.equal(
      (await lookup('submitExpense', 'claim2')).value.result.expenseId,
      recovered.value.result.expenseId,
    );
    assert.equal((await get('/ledger')).counts.expenses, 1);
    const records = await get('/expenses');
    assert.equal(records.records[0].amount, '1280.00');
    await control({ operation: 'saveDraft', mode: 'hold' });
    await write('saveDraft', 'pending', itinerary);
    assert.equal((await lookup('saveDraft', 'pending')).value.status, 'unknown');
    await service.close();
    service = null;
    await start();
    assert.equal((await lookup('saveDraft', 'pending')).value.status, 'unknown');
    await control({ operation: 'saveDraft', cancel: 'pending' });
    await control({ operation: 'saveDraft', release: 'pending' });
    assert.equal((await lookup('saveDraft', 'pending')).value.status, 'notExecuted');
    assert.equal((await write('saveDraft', 'pending', itinerary)).code, 409);
    assert.equal((await lookup('saveDraft', 'absent')).value.status, 'unknown');
    await control({ queryFailure: true });
    assert.equal((await lookup('submitExpense', 'claim')).code, 503);
    assert.equal((await get('/ledger')).counts.expenses, 1);
  },
);
