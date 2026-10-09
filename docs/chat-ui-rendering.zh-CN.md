# 聊天内的两种界面渲染方式

[English](chat-ui-rendering.md) · **简体中文**

Ambleloft 的聊天中可以显示两种交互界面：**宿主渲染的声明式表单**，以及**扩展提供 HTML、由宿主 iframe 承载的页面**。两者都能出现在聊天里，区别在于界面由谁实现，而不是它看起来像不像表单。Agent 负责调用相应工具触发展示，不负责绘制控件。

## 先选案例

| 对比项 | 宿主渲染表单 | 扩展页面通过 iframe 渲染 |
| --- | --- | --- |
| 开发者提供 | YAML：字段、步骤、提交行为及操作映射 | HTML/CSS/JavaScript，以及页面关联的业务操作 |
| 谁渲染控件 | 宿主的表单组件 | 扩展 HTML 页面；宿主提供隔离 iframe 容器 |
| 如何触发 | Agent 调用宿主 `forms_list`、`forms_present` | Agent 调用带 UI 资源元数据的 `render` 操作 |
| 如何声明 | Skill 用 `amble-form-ref` 引用 YAML | 清单 `contributes.mcpApps` 声明资源，操作 `_meta.ui.resourceUri` 关联该资源 |
| 用户交互 | 宿主管理字段、步骤与表单实例；按声明发送聊天消息或调用操作 | 页面管理 DOM 与交互，通过 MCP Apps 协议请求宿主调用操作 |
| 通信方式 | 宿主解释表单声明；扩展实现其中引用的业务 handler | `ui/initialize` 初始化、`ui/notifications/tool-result` 接收数据、`tools/call` 请求保存 |
| 适合的需求 | 使用已有字段和步骤完成信息收集、确认及业务提交 | 需要自定义布局、控件和交互逻辑的聊天内页面 |
| 入门案例 | [团队信息收集](../declarative-intake/README.zh-CN.md) | [聊天内差旅卡片](../mcp-apps-card/README.zh-CN.md) |
| 进阶案例 | [差旅报销助手](../expense-workflow/README.zh-CN.md)、[提交结果核实](../submission-recovery/README.zh-CN.md) | 本仓库当前以 `mcp-apps-card` 演示已支持的协议子集 |

## 方式一：宿主渲染表单

![宿主渲染：聊天内七字段表单](../declarative-intake/screenshots/02-form.png)

截图中的输入框、布局和确认交互由宿主生成。开发者修改 [intake.yaml](../declarative-intake/skills/intake/intake.yaml) 的声明，不需要编写这张聊天表单的 HTML。

执行路径：用户提出需求 → Agent 查找并展示表单 → 宿主渲染控件 → 用户填写和确认 → 宿主执行声明的提交行为。`declarative-intake` 将填写结果发送到当前聊天；`expense-workflow` 则将字段映射到后台业务操作。

报销案例的三步表单定义见 [travel.yaml](../expense-workflow/skills/expense/forms/travel.yaml)，业务实现见 [main.ts](../expense-workflow/src/main.ts)。表单实例与提交状态由宿主管理；账本持久化、幂等和结果查询仍由业务服务实现，不能只靠 UI 保证。

## 方式二：扩展页面通过 iframe 渲染

![iframe 页面：扩展 HTML 实现的聊天内差旅卡片](../mcp-apps-card/screenshots/01-card.png)

截图中的表单布局和控件由扩展的 [form.html](../mcp-apps-card/form.html) 实现。虽然也有输入框，它属于自定义页面，并不是 YAML 声明式表单。

执行路径：Agent 调用 `samples.mcp-apps-card.render` → 宿主按 UI 资源映射加载包内 HTML 到 iframe → 页面初始化并接收工具结果 → 用户编辑 → 页面通过 `tools/call` 请求 `save` → 宿主确认后调用后台操作 → 页面显示保存结果。

查看 [extension.json](../mcp-apps-card/extension.json) 的资源和操作映射，以及 [main.cjs](../mcp-apps-card/main.cjs) 的 `render`、`save` 实现。本例保存到扩展本地存储，不提交财务系统。iframe 隔离不会授予业务权限，页面调用仍受宿主权限和确认策略约束。

## 不要把扩展首页当作聊天 iframe

`extension-home` 以及报销的服务检查/记录首页属于独立扩展页面，使用 SDK 的 `@ambleloft/extension-sdk/webview` 桥。聊天内 MCP Apps 页面使用其 UI 协议，不能直接混用两套初始化和调用代码。

因此，报销案例包含“独立扩展首页 + 宿主渲染的聊天表单”，并未实现第二套 iframe 报销表单；`mcp-apps-card` 才是聊天 iframe 的最小案例，且没有独立首页。

当前不提供通过扩展首页 SDK 直接展示或恢复表单的公开接口；按案例提示词由 Agent 调用宿主表单工具。不要把聊天界面渲染能力理解成聊天事件订阅能力。

以上截图复用仓库已验证的真实桌面采集，使用虚构数据。范围与限制见 [验证记录](verification.md) 和 [已知缺口](gaps.md)。
