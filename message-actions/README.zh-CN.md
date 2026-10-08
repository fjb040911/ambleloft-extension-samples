# 消息业务操作

[English](README.md) · **简体中文**

从消息提交任务，再查询服务结果。未知写入不自动重试。

## 运行

需要 Node.js ≥22.13 和支持扩展的 Ambleloft。SDK/CLI 从 npm 安装，版本固定为 `0.1.0-alpha.7`，无需相邻源码仓库。

```sh
cd message-actions
npm ci
npm run build
npm run validate
npm test
npm run pack
```

在宿主 **设置 → 扩展 → 安装扩展** 选择 `dist/message-actions.amble-extension`，信任后按提示授权，再打开扩展首页。安装包 ID 为 `samples.message-actions`。

## 体验步骤

运行 `npm run service`，配置 actionServiceUrl 为 `http://127.0.0.1:47833`。发布待办后在消息中心点击提交并确认。查询执行记录，复制 invocation ID，填写原 eventKey，再点击核实并回报。unknown 模式故意在服务保存后断开响应，核实不会重新提交。

## 截图与验证

以下图片采集自 macOS 上的真实 Ambleloft 桌面，使用隔离 profile、虚构数据、本机模拟服务和确定性模拟模型。扩展页面截图来自实际隔离 WebContents；表单和消息截图来自宿主窗口。它们不是设计稿或浏览器 mock。

![真实宿主中的扩展首页。](screenshots/01-home.png)

真实宿主中的扩展首页。

![消息动作写后丢响应，宿主保留 unknown 并阻止重复写。](screenshots/02-unknown.png)

消息动作写后丢响应，宿主保留 unknown 并阻止重复写。

![查询业务结果后回报 completed，仅发生一次业务写入。](screenshots/03-reconciled.png)

查询业务结果后回报 completed，仅发生一次业务写入。

[完整验证记录与未覆盖项](../docs/verification.md)。本案例仍标记为 preview，截图不代表所有平台和所有异常均验收完成。

## 权限与实现

`configuration`

项目权限限定到用户授权项目；storage/configuration/secrets 为扩展自身。声明权限不等于已获授权。Node 后台使用公开 SDK，页面通过宿主桥调用；MCP Apps 卡片使用独立任务 UI 协议。

| Operation | Handler | Effect | Caller |
| --- | --- | --- | --- |
| `samples.message-actions.actionPublish` | `actionPublish` | write | page |
| `samples.message-actions.actionRecords` | `actionRecords` | read | page |
| `samples.message-actions.actionRun` | `actionRun` | write | page |
| `samples.message-actions.actionReconcile` | `actionReconcile` | write | page |

## 错误、限制与清理

取消确认不会派发该写入；取消等待不等于回滚，结果未知时先查询，不自动重试写入。拒绝授权后相关操作应失败；修改权限后由用户重新授权。

扩展为 alpha 预览。表单 YAML 和部分演示控件使用中文；不要把双语文档理解为所有表单自动本地化。企业认证需要实际 IdP；消息仅本地作用域，remind 不是系统送达回执。

在扩展设置停用/卸载；数据是否清除由用户选择。独立服务用 Ctrl+C 停止。只在停服后删除自己创建的演示 SQLite 数据；不要清理真实用户 profile。

```sh
# accepted -> completed: use the invocation ID shown in records
curl http://127.0.0.1:47833/complete -H 'content-type: application/json' -d '{"id":"REPLACE_WITH_INVOCATION_ID"}'
```
