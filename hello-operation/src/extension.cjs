const { defineExtension } = require('@ambleloft/extension-sdk');
exports.activate = (context) => {
  const register = (n, f) => context.subscriptions.push(context.operations.register(n, f));
  register('count', async ({ text }) => ({
    characters: [...text].length,
    words: text.trim() ? text.trim().split(/\s+/u).length : 0,
    lines: text ? text.split(/\r?\n/).length : 0,
  }));
};
