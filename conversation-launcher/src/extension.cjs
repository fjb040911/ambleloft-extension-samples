const { defineExtension } = require('@ambleloft/extension-sdk');
exports.activate = (context) => {
  const register = (n, f) =>
    context.subscriptions.push(
      context.operations.register(n, async (...args) => ({
        data: JSON.stringify(await f(...args)),
      })),
    );
  register('create', async (i, c) => ({ ...(await c.resources.createConversation(i)) }));
  register('open', async ({ conversationId }, c) => {
    await c.resources.openConversation(conversationId);
    return { opened: conversationId };
  });
};
