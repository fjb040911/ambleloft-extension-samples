const { test } = require('node:test'),
  assert = require('node:assert/strict');
const h = {};
require('../dist/package/dist/extension.cjs').activate({
  subscriptions: [],
  operations: {
    register(n, f) {
      h[n] = f;
      return { dispose() {} };
    },
  },
});
test('quoted commas, newlines and empty values preserve exact strings', async () => {
  const result = await h.parse({ csv: 'name,note\n"A, B","line 1\nline 2"\nC,\n' });
  assert.equal(result.rowCount, 2);
  assert.deepEqual(result.rows, [
    ['A, B', 'line 1\nline 2'],
    ['C', ''],
  ]);
});
test('malformed CSV rejects rather than silently losing fields', async () => {
  await assert.rejects(h.parse({ csv: 'a,b\n1,2,3' }));
});
