# Ambleloft 扩展示例

[English](README.md) · **简体中文**

**把你的应用接进聊天，让用户在对话中填写、确认、办理业务。**

用宿主表单或自定义页面丰富聊天交互，把操作连接到自己的服务，再通过任务消息持续更新业务进展。本仓库提供 **23 个可运行预览案例**，帮助你从第一个操作，逐步实现表单提交、消息订阅和企业服务连接。

[运行第一个案例](#运行第一个案例) · [查看功能目录](#按功能选择案例) · [体验差旅报销](expense-workflow/README.zh-CN.md)

![聊天内报销：用户填写费用，宿主渲染表单并管理步骤](expense-workflow/screenshots/03-expenses.png)

*真实 Ambleloft 桌面截图，使用虚构数据、本机演示服务与确定性模拟模型。*

## 把聊天变成应用的业务入口

用户提出需求后，可以直接在聊天中填写信息、调整参数、核对结果并确认提交。开发者提供表单声明或页面代码，通过扩展后台把这些操作接到已有应用。

| 你想让用户完成什么 | 扩展如何实现 | 从哪里开始 |
| --- | --- | --- |
| 在对话中填表并提交业务 | 宿主按 YAML 渲染字段与步骤，确认后调用业务操作 | [信息收集](declarative-intake/README.zh-CN.md)、[差旅报销](expense-workflow/README.zh-CN.md) |
| 在聊天中使用自定义界面 | 扩展提供 HTML/CSS/JS，宿主通过 iframe 承载交互页面 | [聊天内差旅卡片](mcp-apps-card/README.zh-CN.md) |
| 读取或更新自己应用的数据 | 用 operation 连接后台服务，声明输入、输出、权限与读写行为 | [基础操作](hello-operation/README.zh-CN.md)、[企业服务连接](enterprise-auth/README.zh-CN.md) |
| 任务有进展时主动通知用户 | 扩展订阅业务服务事件，发布或更新消息；用户通过消息按钮发起操作 | [事件订阅](service-events/README.zh-CN.md)、[消息业务操作](message-actions/README.zh-CN.md) |

例如，你可以将自己的工单状态、审批待办、构建结果或订单进展接入消息中心，再让用户从消息中查看或办理后续业务。这些是可基于案例开发的应用方向；当前消息案例演示本地任务服务，具体业务规则由你的应用实现。

**消息订阅的边界：** `service-events` 订阅的是你自己服务的 SSE 任务事件。Ambleloft 聊天生命周期事件和轮次读取尚未开放，相关案例保留在规划区。

## 选择聊天内的交互方式

| | 宿主渲染表单 | 扩展页面通过 iframe 渲染 |
| --- | --- | --- |
| 你编写什么 | YAML 字段、步骤、提交映射 | HTML、CSS、JavaScript |
| 谁绘制控件 | 宿主表单组件 | 扩展页面 |
| 适合什么 | 信息收集、多步填写、确认提交 | 自定义布局、控件和交互逻辑 |
| 参考案例 | `declarative-intake`、`expense-workflow` | `mcp-apps-card` |

Agent 调用工具触发展示。独立扩展首页使用 SDK webview 桥，聊天 iframe 使用 MCP Apps UI 协议。两者的初始化与调用代码应分别参考对应案例。详见[两种渲染方式的流程与截图](docs/chat-ui-rendering.zh-CN.md)。

## 运行第一个案例

准备 **Node.js ≥22.13.0**、npm，以及支持扩展的 Ambleloft 桌面。仓库锁定 npm 已发布的 SDK/CLI `0.1.0-alpha.7`；每个案例都有独立依赖和锁文件。

```sh
git clone https://github.com/fjb040911/ambleloft-extension-samples.git
cd ambleloft-extension-samples/hello-operation
npm ci
npm run build
npm run validate
npm test
npm run pack
npm run validate:archive
```

在 Ambleloft 打开 **设置 → 扩展 → 安装扩展**，选择 `dist/hello-operation.amble-extension`。信任并完成所需授权后，打开“文本统计”首页，输入文字并调用统计操作。

完成后可继续运行 `declarative-intake` 或 `mcp-apps-card`，分别体验两种聊天交互方式。带服务的案例会在各自 README 中说明启动命令、配置项与聊天提示词。

## 从案例开发自己的扩展

1. **选择业务与交互方式。** 先明确用户要查什么、填什么、提交什么，再从下方目录挑选最接近的案例。
2. **定义扩展与操作。** 在 `extension.json` 声明标识、入口、权限和 operations；为操作定义输入输出 schema、调用方和读写行为。
3. **连接业务服务。** 实现后台 handler，接入自己的 API。按需加入配置、密钥或企业认证；业务服务负责持久化、幂等和结果查询。
4. **实现用户交互。** 宿主表单编写 YAML 并通过 Skill 引用；聊天 iframe 编写页面并关联 MCP Apps 资源；独立首页使用 SDK webview 桥。需要持续进展时，再加入服务事件订阅与消息动作。
5. **构建、安装并验证。** 执行案例的 build、validate、test、pack 和 validate:archive。安装到宿主，实际检查授权、确认、取消及失败后的结果查询；修改后重新构建并安装。

如需从官方模板创建新项目，可以在另一个目录执行：

```sh
npm create ambleloft-extension@0.1.0-alpha.7 my-expense -- --template expense
```

复制案例时需同步修改扩展 ID、operation ID，以及表单或页面中的引用。分享前按[贡献说明](CONTRIBUTING.md)补齐运行说明、权限说明和实际截图。

## 重点案例：差旅报销助手

[expense-workflow](expense-workflow/README.zh-CN.md) 将聊天内交互与业务服务连接起来：用户填写行程和费用，核对后提交；扩展首页展示服务状态和报销记录。如果服务写入后响应丢失，用户可以核实原提交结果，避免重复入账。

它适合学习 **宿主多步表单 → 后台业务操作 → 服务持久化 → 结果查询与恢复** 的完整路径。当前交付为 F0/F1，使用本机演示服务；进度消息集成和企业财务适配属于后续里程碑。对应基础能力可先看 `message-actions` 与 `enterprise-auth`。

## 按功能选择案例

以下 23 个案例均为 `preview`。点击目录可查看运行步骤、权限、源码说明和真实截图。

### 聊天里的表单与交互页面

| 案例目录 | 体验场景 | 对应功能 |
| --- | --- | --- |
| [`declarative-intake`](declarative-intake/README.zh-CN.md) | 团队信息收集 | 宿主表单 · YAML · 七种字段 · 确认后发送聊天 |
| [`mcp-apps-card`](mcp-apps-card/README.zh-CN.md) | 聊天内差旅卡片 | iframe 页面 · HTML/CSS/JS · MCP Apps · 确认保存 |
| [`expense-workflow`](expense-workflow/README.zh-CN.md) | 重点：差旅报销助手 | 宿主多步表单 · 业务服务 · 幂等提交 · 记录查询 |
| [`submission-recovery`](submission-recovery/README.zh-CN.md) | 提交结果核实 | 宿主表单 · 写后丢响应 · unknown 状态 · 只读核实 |

### 消息订阅与业务操作

| 案例目录 | 体验场景 | 对应功能 |
| --- | --- | --- |
| [`service-events`](service-events/README.zh-CN.md) | 订阅业务任务事件 | SSE 订阅 · 消息推送 · 版本去重 · 乱序保护 |
| [`local-messages`](local-messages/README.zh-CN.md) | 管理本地业务消息 | 发布 · 查询 · 更新 · 撤回消息 |
| [`message-actions`](message-actions/README.zh-CN.md) | 从消息办理业务 | 消息按钮 · 用户确认 · 后台写入 · 执行结果核实 |

### 接入自己的应用与数据

| 案例目录 | 体验场景 | 对应功能 |
| --- | --- | --- |
| [`hello-operation`](hello-operation/README.zh-CN.md) | 第一个扩展操作 | Agent 与页面共用 operation · 输入输出 schema |
| [`npm-data-transform`](npm-data-transform/README.zh-CN.md) | CSV 数据转换 | 打包 npm 依赖 · 结构化解析 · 操作结果 |
| [`enterprise-auth`](enterprise-auth/README.zh-CN.md) | 连接企业服务 | 宿主管理账号会话 · 声明 HTTPS 资源 · 认证请求 |
| [`configuration`](configuration/README.zh-CN.md) | 读取扩展设置 | 配置声明 · 设置界面 · 后台读取 |
| [`secret-input`](secret-input/README.zh-CN.md) | 安全输入密钥 | 宿主密钥输入 · 扩展 secrets · 查询是否存在 |
| [`storage-notebook`](storage-notebook/README.zh-CN.md) | 本地便签 | 扩展存储 · 版本读取 · CAS 冲突保护 |
| [`operation-confirmation`](operation-confirmation/README.zh-CN.md) | 确认业务写入 | read/write 声明 · 创建和删除前确认 |
| [`cancellation-and-errors`](cancellation-and-errors/README.zh-CN.md) | 取消等待与处理错误 | 取消只读操作 · 超时与错误展示 · 写入边界 |

### 扩展页面、项目与聊天入口

| 案例目录 | 体验场景 | 对应功能 |
| --- | --- | --- |
| [`extension-home`](extension-home/README.zh-CN.md) | 独立扩展首页 | 页面入口 · SDK webview 桥 · 调用后台 |
| [`theme-and-i18n`](theme-and-i18n/README.zh-CN.md) | 主题与语言 | 宿主上下文 · 深浅主题 · 语言变更事件 |
| [`extension-icons`](extension-icons/README.zh-CN.md) | 扩展图标 | 包内图标 · 浅深主题资源 · 宿主入口 |
| [`project-card`](project-card/README.zh-CN.md) | 项目卡片 | 项目选择与授权 · 项目信息 · 路径独立授权 |
| [`contextual-entry`](contextual-entry/README.zh-CN.md) | 按上下文显示入口 | 上下文键 · 条件入口 · 关联与解除 |
| [`conversation-launcher`](conversation-launcher/README.zh-CN.md) | 创建和继续聊天 | 项目范围 · 创建聊天草稿 · 打开已有聊天 |

### 组合案例

| 案例目录 | 体验场景 | 对应功能 |
| --- | --- | --- |
| [`team-workbench`](team-workbench/README.zh-CN.md) | 团队工作台 | 项目关联 · 业务任务 · 继续相关聊天 |
| [`extension-showcase`](extension-showcase/README.zh-CN.md) | 扩展能力体验馆 | 项目 · 表单 · 消息 · 操作 · 企业连接 |

### 规划中的聊天事件能力

| 案例目录 | 计划展示 | 当前状态 |
| --- | --- | --- |
| [`conversation-events`](conversation-events/README.zh-CN.md) | 订阅聊天生命周期事件、读取轮次进展 | 等待公开接口，尚不可运行 |
| [`conversation-business-sync`](conversation-business-sync/README.zh-CN.md) | 将聊天结果同步到业务系统 | 等待聊天事件与轮次读取接口，尚不可运行 |

## 验证与兼容性

2026-10-08 的基线验证记录包含：23 个案例构建与归档校验、30 项自动化测试、真实宿主安装，以及 50 张桌面截图。各案例仍为预览，具体交互覆盖见[验证记录](docs/verification.md)。

企业认证需要配置真实 IdP；Windows/Linux 桌面尚未验收。新页面初始语言与报销核实后的旧错误提示存在宿主缺口，详见[已知限制](docs/gaps.md)。

批量维护所有可运行案例：

```sh
npm ci
npm run setup
npm run build
npm run validate
npm run pack
npm run validate:archives
npm test
```

[需求与范围](docs/requirements.md) · [兼容性](docs/compatibility.md) · [机器可读目录](catalog.json) · [贡献说明](CONTRIBUTING.md) · [安全说明](SECURITY.md) · [许可证](LICENSE)
