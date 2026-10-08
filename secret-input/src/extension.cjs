const { defineExtension } = require('@ambleloft/extension-sdk');
exports.activate = (context) => {
  const register = (n, f) =>
    context.subscriptions.push(
      context.operations.register(n, async (...args) => ({
        data: JSON.stringify(await f(...args)),
      })),
    );
  register('exists', async () => ({ saved: (await context.secrets.get('demo-key')) !== null }));
  register('remove', async () => {
    await context.secrets.delete('demo-key');
    return { saved: false };
  });
};
