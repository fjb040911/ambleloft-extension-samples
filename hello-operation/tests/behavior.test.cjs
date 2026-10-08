const { test } = require('node:test'),
  assert = require('node:assert/strict');
const handlers = {};
require('../dist/package/dist/extension.cjs').activate({
  subscriptions: [],
  operations: {
    register(n, f) {
      handlers[n] = f;
      return { dispose() {} };
    },
  },
});
test('empty input and unicode code points are counted without surrogate splitting', async () => {
  assert.deepEqual(await handlers.count({ text: '' }), { characters: 0, words: 0, lines: 0 });
  assert.deepEqual(await handlers.count({ text: '😀 hi\n世界' }), {
    characters: 7,
    words: 3,
    lines: 2,
  });
});
