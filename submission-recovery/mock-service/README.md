# 本机报销模拟服务 0.1.0

`EXPENSE_DB=/tmp/my-expense-test/ledger.sqlite PORT=47832 node server.cjs`

Node >=22.13 的 node:sqlite（可能显示实验性警告）。独立进程，固定测试租户，无真实认证。只监听 127.0.0.1。Ctrl+C/SIGTERM 停服后可删除指定隔离数据目录；不自动删除用户数据。

写入去重键：(local-demo-tenant, operation, submissionId)。SQLite 主键、BEGIN IMMEDIATE 事务同时提交业务与成功结果。费用表 draftId UNIQUE 阻止新键重复正式报销。取消将 pending 持久化为 notExecuted，finish 事务先检查状态，所以晚到 release/旧请求不能再写。无记录或未决 pending 都返回 unknown。

接口与注入步骤见 ../expense/README.md。GET /ledger 不输出请求原文或凭据；仅输出标识、状态、结果及计数。服务是本机测试设施，不应暴露公网，也不是企业身份/租户隔离实现。根目录 `npm run test:expense:service` 执行幂等、冲突、丢响应、取消、查询失败、重启屏障测试。
