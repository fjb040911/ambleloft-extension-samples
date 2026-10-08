const { defineExtension } = require('@ambleloft/extension-sdk');
const { parse } = require('csv-parse/sync');
exports.activate = (context) => {
  const register = (n, f) => context.subscriptions.push(context.operations.register(n, f));
  register('parse', async ({ csv }) => {
    const rows = parse(csv, {
      columns: false,
      skip_empty_lines: true,
      bom: true,
      max_record_size: 20000,
    });
    if (rows.length > 1000) throw Error('Maximum 1000 rows');
    const columns = rows.shift() || [];
    return { rowCount: rows.length, columns, rows };
  });
};
