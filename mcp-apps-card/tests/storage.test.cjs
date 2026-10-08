const { test } = require('node:test');
const assert = require('node:assert/strict');
test('first card save creates with null revision; subsequent saves compare the stored revision', async () => {
  const handlers = {},
    calls = [];
  let prior = null;
  require('../main.cjs').activate({
    operations: {
      register(name, handler) {
        handlers[name] = handler;
      },
    },
    storage: { get: async () => prior, set: async (...args) => calls.push(args) },
  });
  const data = { destination: '上海', amount: 1200 };
  assert.deepEqual(await handlers.save(data), data);
  assert.equal(calls[0][2], null);
  prior = { value: data, revision: 9 };
  await handlers.save({ ...data, amount: 1300 });
  assert.equal(calls[1][2], 9);
});
