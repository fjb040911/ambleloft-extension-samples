const { defineExtension } = require('@ambleloft/extension-sdk');
exports.activate = (context) => {
  const register = (n, f) =>
    context.subscriptions.push(
      context.operations.register(n, async (...args) => ({
        data: JSON.stringify(await f(...args)),
      })),
    );
  register('link', async ({ linked }) => {
    await context.context.set('ext.samples.contextual-entry.linked', linked);
    return { linked };
  });
};
