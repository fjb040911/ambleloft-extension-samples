const { defineExtension } = require('@ambleloft/extension-sdk');
exports.activate = (context) => {
  const register = (n, f) =>
    context.subscriptions.push(
      context.operations.register(n, async (...args) => ({
        data: JSON.stringify(await f(...args)),
      })),
    );
  register('read', async () => ({
    ...((await context.storage.get('note')) || { value: null, revision: null }),
  }));
  register('save', async ({ text, expectedRevision }) => ({
    revision: await context.storage.set(
      'note',
      text,
      expectedRevision === 0 ? null : expectedRevision,
    ),
    value: text,
  }));
  register('remove', async ({ expectedRevision }) => {
    if (expectedRevision === 0) throw Error('Read an existing note first');
    await context.storage.delete('note', expectedRevision);
    return { value: null, revision: null };
  });
};
