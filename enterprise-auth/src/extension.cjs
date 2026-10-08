const { defineExtension } = require('@ambleloft/extension-sdk');
exports.activate = (context) => {
  const register = (n, f) =>
    context.subscriptions.push(
      context.operations.register(n, async (...args) => ({
        data: JSON.stringify(await f(...args)),
      })),
    );
  let changes = 0;
  const auth = () => {
    if (!context.authentication)
      throw Object.assign(Error('Authentication unsupported'), { code: 'UNSUPPORTED' });
    return context.authentication;
  };
  if (context.authentication)
    context.subscriptions.push(context.authentication.onDidChangeSessions(() => changes++));
  register('status', async () => ({ session: await auth().getSession('business'), changes }));
  register('connect', async (_, call) => ({
    ...(await call.authentication.requestSession('business')),
  }));
  register('disconnect', async () => {
    await auth().disconnect('business');
    return { disconnected: true };
  });
  register('request', async ({ path }) => {
    const session = await auth().getSession('business');
    if (!session)
      throw Object.assign(Error('请先连接企业服务 / Connect first'), {
        code: 'INTERACTION_REQUIRED',
      });
    return { ...(await auth().request({ sessionId: session.id, path, method: 'GET' })) };
  });
};
