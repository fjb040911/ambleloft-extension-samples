const { test } = require('node:test');
const assert = require('node:assert/strict');
const m = require('../extension.json');
test('all manifest handlers register synchronously without executing a business write', () => {
  const registered = [];
  const disposable = { dispose() {} };
  let effects = 0;
  const context = {
    extensionId: m.publisher + '.' + m.name,
    operations: {
      register(n, f) {
        registered.push(n);
        return disposable;
      },
    },
    subscriptions: [],
    configuration: { get: async () => ({}), onDidChange: () => disposable },
    authentication: { onDidChangeSessions: () => disposable },
    messages: Object.fromEntries(
      [
        'publish',
        'getByEventKey',
        'update',
        'withdraw',
        'getPreferences',
        'listActionInvocations',
        'reportActionResult',
      ].map((k) => [
        k,
        () => {
          effects++;
          return Promise.resolve(null);
        },
      ]),
    ),
  };
  require('../dist/package/' + m.main).activate(context);
  assert.deepEqual(registered.sort(), m.operations.map((o) => o.handler).sort());
  assert.equal(effects, 0);
  context.subscriptions.forEach((x) => x.dispose());
});
