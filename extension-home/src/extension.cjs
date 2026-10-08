const { defineExtension } = require('@ambleloft/extension-sdk');
exports.activate = (context) => {
  const register = (n, f) =>
    context.subscriptions.push(
      context.operations.register(n, async (...args) => ({
        data: JSON.stringify(await f(...args)),
      })),
    );
  register('list', async () => ({
    records: [
      { id: 'DEMO-001', title: '上海客户拜访', status: 'draft' },
      { id: 'DEMO-002', title: '北京团队会议', status: 'submitted' },
    ],
  }));
};
