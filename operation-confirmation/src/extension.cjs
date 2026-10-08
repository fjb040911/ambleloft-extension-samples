const { defineExtension } = require('@ambleloft/extension-sdk');
exports.activate = (context) => {
  const register = (n, f) =>
    context.subscriptions.push(
      context.operations.register(n, async (...args) => ({
        data: JSON.stringify(await f(...args)),
      })),
    );
  register('read', async () => ({ record: await context.storage.get('record') }));
  register('save', async ({ text }) => {
    const old = await context.storage.get('record');
    return { revision: await context.storage.set('record', text, old?.revision ?? null) };
  });
  register('remove', async () => {
    const old = await context.storage.get('record');
    if (old) await context.storage.delete('record', old.revision);
    return { deleted: !!old };
  });
};
