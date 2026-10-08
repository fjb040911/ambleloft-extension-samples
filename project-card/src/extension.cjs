const { defineExtension } = require('@ambleloft/extension-sdk');
exports.activate = (context) => {
  const register = (n, f) => context.subscriptions.push(context.operations.register(n, f));
  register('describe', async ({ projectId }, call) => ({
    ...(await call.resources.getProject(projectId)),
  }));
  register('path', async ({ projectId }, call) => ({
    path: await call.resources.getProjectPath(projectId),
  }));
};
