const { defineExtension } = require('@ambleloft/extension-sdk');
exports.activate = (context) => {
  const register = (n, f) =>
    context.subscriptions.push(
      context.operations.register(n, async (...args) => ({
        data: JSON.stringify(await f(...args)),
      })),
    );
  register('guide', async () => ({
    prompt: '请用团队信息收集扩展展示团队计划表单。',
    template: 'team-intake',
    writesBusinessRecord: false,
  }));
};
