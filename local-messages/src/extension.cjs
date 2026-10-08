const { defineExtension } = require('@ambleloft/extension-sdk');
const { getMessages } = require('@ambleloft/extension-sdk/messages-preview');
exports.activate = (context) => {
  const register = (n, f) =>
    context.subscriptions.push(
      context.operations.register(n, async (...args) => ({
        data: JSON.stringify(await f(...args)),
      })),
    );
  const messages = () => getMessages(context);
  register('publish', async ({ eventKey }) => ({
    ...(await messages().publish({
      eventKey,
      title: '团队进展已更新',
      body: '虚构任务：上海客户回访计划已准备好。',
      category: 'notice',
      actions: [],
    })),
  }));
  register('query', async ({ eventKey }) => ({
    message: await messages().getByEventKey(eventKey),
  }));
  register('update', async ({ eventKey }) => {
    const m = await messages().getByEventKey(eventKey);
    if (!m) throw Error('Message not found');
    return {
      message: await messages().update(m.id, { body: '虚构任务：计划已核对。' }, m.revision),
    };
  });
  register('withdraw', async ({ eventKey }) => {
    const m = await messages().getByEventKey(eventKey);
    if (!m) throw Error('Message not found');
    return { message: await messages().withdraw(m.id, m.revision) };
  });
};
