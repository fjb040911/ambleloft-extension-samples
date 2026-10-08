const { defineExtension } = require('@ambleloft/extension-sdk');
exports.activate = (context) => {
  const register = (n, f) =>
    context.subscriptions.push(
      context.operations.register(n, async (...args) => ({
        data: JSON.stringify(await f(...args)),
      })),
    );
  let changes = 0;
  context.subscriptions.push(
    context.configuration.onDidChange(() => {
      changes++;
    }),
  );
  register('read', async () => ({ configuration: await context.configuration.get(), changes }));
};
