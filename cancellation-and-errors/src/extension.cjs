const { defineExtension } = require('@ambleloft/extension-sdk');
exports.activate = (context) => {
  const register = (n, f) =>
    context.subscriptions.push(
      context.operations.register(n, async (...args) => ({
        data: JSON.stringify(await f(...args)),
      })),
    );
  register('slow', async (_, c) => {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 8000);
      c.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(Object.assign(Error('Cancelled'), { code: 'CANCELLED' }));
        },
        { once: true },
      );
    });
    return { completed: true };
  });
  register('fail', async () => {
    throw Object.assign(Error('Demonstration failure'), { code: 'INVALID_ARGUMENT' });
  });
};
