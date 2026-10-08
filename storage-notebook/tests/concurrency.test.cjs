const { test } = require('node:test'),
  assert = require('node:assert/strict');
test('the handler forwards the displayed revision and exposes host conflicts', async () => {
  const h = {};
  let revision = null;
  require('../dist/package/dist/extension.cjs').activate({
    subscriptions: [],
    operations: {
      register(n, f) {
        h[n] = f;
        return { dispose() {} };
      },
    },
    storage: {
      set: async (k, v, r) => {
        revision = r;
        throw Object.assign(Error('Conflict'), { code: 'CONFLICT' });
      },
    },
  });
  await assert.rejects(h.save({ text: 'second window', expectedRevision: 7 }), {
    code: 'CONFLICT',
  });
  assert.equal(revision, 7);
});
