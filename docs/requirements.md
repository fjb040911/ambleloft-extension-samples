# Ambleloft Extension Samples 需求草案

更新日期：2026-10-08 · 本文保留完整建设目标。当前交付与实际验收见 [README](../README.zh-CN.md) 和 [验证记录](verification.md)；规划目标不自动代表已完成。

## 1. 项目定位

创建独立项目 `ambleloft-extension-samples`，目标仓库为 https://github.com/fjb040911/ambleloft-extension-samples 。本地目录已创建；远程仓库的可访问性、内容与发布状态须在实施时确认。

参考 https://github.com/microsoft/vscode-extension-samples 的独立示例组织方式。每个示例回答一个明确问题，开发者可以单独构建、安装、体验并复制改造。API 以 Ambleloft 宿主与 SDK 的真实契约为准，不声明兼容 VS Code 扩展。

面向三类读者：首次开发扩展的开发者、连接业务服务的集成开发者，以及评估扩展能力的产品团队。仓库同时提供单能力教学案例和完整业务案例，官网可以链接到案例源码、说明与实际验收证据。

### 对外介绍文案

- 中文标题：Ambleloft 扩展示例
- 英文标题：Ambleloft Extension Samples
- 中文简介：从一个可运行的例子开始，为 Ambleloft 添加业务工具、扩展页面、聊天内表单和消息推送。
- 英文简介：Start with a runnable example to add business tools, extension pages, in-chat forms, and notifications to Ambleloft.
- 规划期说明：示例库正在建设。下方列出计划案例及其能力前提；已验证案例将提供源码、运行步骤和桌面验收记录。
- 核心体验说明：在页面中操作，也能通过 Agent 调用同一项业务能力；在聊天中填写和确认信息，再由扩展完成业务处理。

## 2. 当前能力与版本基线

宿主源码：https://github.com/fjb040911/Ambleloft ，本地目录 `agent`。
工具链源码：https://github.com/fjb040911/extension-tooling ，本地目录 `extension-tooling`。

本次检查 SDK / CLI / create initializer 工作区版本为 `0.1.0-alpha.7`，Manifest 为 `1.0-draft`，host API 为 `1`；要求 Node >=22.13.0。工具库 README 已记录 alpha.7 发布 npm，并提供 npm create 入口。2026-10-08 已独立查询 npm registry，确认 SDK、CLI 和 create initializer 的 alpha 标签均为 0.1.0-alpha.7。公开 API 仍为 alpha 预览。

源码核对基线：宿主 `237e8c6746e8e0ed6a17edffe44877a3118068d3`（本次检查工作区干净）；tooling HEAD 为 `c6e1d3829e2706c36316a71dc6965d4eed041286`，有大量未提交修改，本次能力判断包含这些修改，不能声称由该 commit 单独复现。正式案例交付须记录提交、工作区差异或快照摘要、Node 与宿主应用版本、包版本及来源。

本次 `check:upstream` 通过 16 个文件的同步检查；`doctor --require operations,declarativeForms,localMessages,messageActions,extensionAuthentication` 返回 sourceStatus=matched、runtimeStatus=not-tested。它们是源码检查，不代表本次重跑了桌面或企业 IdP 验收。本次另调用 test:expense:service，进程退出码为 0，但未输出脚本预期的 PASS/evidence/ledger；此项记为待核实，不能作为报销服务验收通过的证据。

| 能力 | 本次核对结果 | 案例处理方式 |
| --- | --- | --- |
| Node Operation、页面、项目授权、存储、配置、安全输入 | 已有实现与开发者预览契约 | 可开始编写，仍需独立验收 |
| 创建聊天草稿、打开既有聊天 | 已有实现；创建不自动运行模型 | 可开始编写 |
| 声明式表单、多步骤提交及结果核实 | 已有实现及 expense 示例 | 复用真实契约，写清宿主限制 |
| MCP Apps 聊天内卡片 | 有限首版实现及 task-form 示例 | 按已实现协议子集演示 |
| 发布、查询、更新、撤回本地消息 | 独立 messages-preview 入口 | 必须检测运行时支持 |
| 本机业务 SSE 推送 | team-lab 已有示例 | 作为业务协议集成，不能称为宿主通用订阅 API |
| 聊天轮次事件订阅、对应轮次读取 | M2 设计范围，当前公开 SDK 未提供接口 | 仅列规划和验收目标，等待宿主与 SDK 契约 |
| 消息 Operation 按钮与持久结果回报 | 已开放 messages-preview 两个增量方法、invocation.message | 新增 message-actions 专题，融入报销增强版 |
| 企业 OIDC 认证与宿主 HTTPS 代理 | SDK authentication 已有公开预览入口 | 新增 enterprise-auth 专题，报销企业接入单独验收 |
| 扩展 PNG 图标、深浅主题图标 | manifest.icon 与包资源校验已实现 | 新增 extension-icons 专题，报销作为示范 |
| npm create 与源码 doctor | 工具链已有实现 | 纳入所有案例入门与开发验收，不当作运行时协商 |
| 完整后台 Agent 作业、账号作用域消息 | 当前无可依赖的公开支持 | 保留能力缺口 |

内部运行时存在事件不等于扩展可订阅。宿主 API 版本号也不足以证明消息预览可用，必须进行真实能力检测。

### 2.1 覆盖审查结论与补齐范围

原 22 例覆盖了基础操作、资源、页面、存储、配置、表单、MCP Apps 和单向消息，但未完整覆盖 10 月 8 日新增的消息动作、企业认证、图标与工具链入口。此次增补 3 个专题，共 25 例，并增强已有案例的验收范围。

| 当前能力 | 覆盖案例或公共要求 | 本次调整 |
| --- | --- | --- |
| Operation、Schema、读写确认、Agent/页面路由 | hello-operation、operation-confirmation、expense-workflow | 增加报销表单上下文和消息上下文的边界 |
| 项目读取、路径独立授权、补充授权 | project-card | 增加 getProjectPath、requestGrant 的可选教学步骤；基础读取不默认索要路径权限 |
| 聊天创建/打开与稳定身份 | conversation-launcher、team-workbench | 验收取消、归档/删除引用、打开权限及创建结果未知 |
| 页面桥、主题、语言、条件入口 | extension-home、theme-and-i18n、contextual-entry | 保留；页面与 MCP Apps 环境分开说明 |
| KV、配置、安全输入 | storage-notebook、configuration、secret-input | 保留；区分普通 secrets 与不出宿主的认证 Token |
| 静态表单、线性步骤、Skill 引导、提交恢复 | declarative-intake、expense-workflow、submission-recovery | 报销提升为旗舰，恢复进入其核心必验范围 |
| 包内 MCP Apps UI | mcp-apps-card | 保留；不要求报销重复实现两套写入 UI |
| 本地消息与 SSE | local-messages、service-events | 保留；增加与报销业务状态关联 |
| 消息 actions 与回报日志 | message-actions、expense-workflow 增强版 | 新增 |
| OIDC、会话变化、受限 HTTPS 请求 | enterprise-auth、expense-workflow 企业版 | 新增；企业部署条件明确 |
| 包图标 | extension-icons；旗舰默认集成 | 新增 |
| 激活/停用/崩溃恢复、多窗口与资源释放 | extension-home、service-events、message-actions、公共验收 | 明确按需/startup 激活、释放订阅、旧实例不能继续写入；不自动重放 Operation |
| 安装/升级/回退/开发目录/README 与许可 | 各案例公共交付要求 | 增加更新权限、旧表单失效、打包及许可证说明 |
| init/create、validate/pack、doctor | 各案例公共开发流程 | npm 入门优先；doctor 仅源码诊断 |
| 聊天 Hook、直接表单恢复/展示 API | conversation-events 等规划项 | 仍未开放；已有草稿恢复不等于 forms_resume API |

覆盖范围是“扩展作者可使用的公开能力”，不把 Ambleloft 内部实现或所有核心应用功能都列为扩展 API。源码能力清单、类型、实现与测试入口优先于历史方向稿；部分方向稿和 SDK 注释仍保留旧版本文字，应避免据此回退能力判断。

证据入口：宿主 `specs/extensions/current-capabilities.md`、`contracts/host-capabilities.json`、`contracts/sdk.d.ts`；工具库 `packages/sdk/contracts.d.ts`、`messages-preview.cjs`、`docs/message-actions-auth-guide.md`、`docs/extension-icons.md`、`packages/cli/README.md`，以及现有 expense、extension-lab、notification-auth 源码。相关测试存在不等于本次全部执行。

## 3. 案例目录与统一介绍

以下名称与中文介绍可直接用于仓库目录页。阶段表示交付顺序，不表示已经完成。所有新案例初始为 `planned`。

### 3.1 单能力教学案例

| 目录 / 阶段 | 展示名称与介绍文案 | 教学目标与成功结果 |
| --- | --- | --- |
| hello-operation / A | 第一个业务操作：让 Agent 统计一段文本的字数和行数。 | 最小 Node handler、同步注册、清单绑定、输入输出 Schema；合法输入返回确定结果，非法输入被拒绝。 |
| project-card / A | 项目卡片：在扩展页面和聊天中查看已授权项目的信息。 | 项目选择与授权、真实 invocation 作用域、共用读取操作；进阶步骤单独请求路径权限，验证拒绝和补充授权。 |
| npm-data-transform / A | 数据转换：把粘贴的 CSV 转成 JSON，并查看统计摘要。 | 复用纯 JS npm 库、依赖打包、离线处理；引号、空值和非法数据有明确结果。 |
| extension-home / C | 扩展首页：在独立页面中查看列表、打开详情并执行操作。 | webRoot、宿主桥接和后台 Operation；刷新页面不重复写入。 |
| storage-notebook / C | 本地便签：保存便签，并处理两个窗口同时编辑的冲突。 | 私有 KV、重启持久化、null、revision 比较、删除后版本语义；冲突不能静默覆盖。 |
| configuration / C | 扩展设置：修改显示密度和数量限制，让后台应用新配置。 | 配置声明、变更订阅、应用默认值、释放订阅；不虚构页面配置事件接口。 |
| theme-and-i18n / C | 主题与语言：让扩展页面跟随宿主切换中英文和深浅主题。 | 清单本地化和页面上下文变化；后台字典的更新边界单独说明。 |
| secret-input / C | 安全输入：通过宿主保存测试密钥，页面只显示是否已保存。 | self secrets 权限、安全输入、存在性和删除；测试值不出现在页面、日志或截图。 |
| contextual-entry / C | 条件入口：关联业务任务后，显示对应的工作台入口。 | context key 与 when 条件；解除关联后入口状态正确。 |
| conversation-launcher / C | 任务聊天：为业务任务创建聊天草稿，并继续打开原有聊天。 | 同一任务关联多个聊天、稳定 conversationId；创建不调用模型，打开不暗中创建。 |
| operation-confirmation / C | 操作确认：查询、添加和删除记录，体验宿主的确认流程。 | effect、risk、权限及调用来源；按宿主策略确认，不承诺所有写入均弹窗。 |
| cancellation-and-errors / C | 取消与错误：取消慢操作，并识别服务不可用和结果未知。 | 真实结构化错误、取消等待与业务执行的区别；未知写入不自动重试。 |
| extension-icons / C | 扩展图标：为浅色和深色主题提供清晰的扩展标识。 | 单图/双主题 PNG、包资源复制、四处宿主展示、无图标回退及非法包拒绝。 |

### 3.2 交互与业务案例

| 目录 / 阶段 | 展示名称与介绍文案 | 教学目标与成功结果 |
| --- | --- | --- |
| declarative-intake / B | 信息收集表单：在聊天中填写团队活动信息，确认后发送到当前聊天。 | YAML、七种现有字段、确定性校验、草稿恢复；信息收集不伪装成业务记录创建。 |
| mcp-apps-card / B | 聊天内交互卡片：修改差旅地点和金额，确认后保存本地记录。 | Agent 渲染卡片、标准协议、页面写操作；重新打开卡片不自动保存。 |
| expense-workflow / A→B | 差旅报销助手（旗舰）：在聊天里填写、核对并提交报销，遇到断线也能核实结果。 | 核心三步流程和恢复优先交付；进度消息、消息操作与企业连接按下方里程碑增强。 |
| local-messages / C | 本地消息：把任务进展发布到消息中心，并更新或撤回。 | messages-preview、去重、revision 与真实回执；无支持时明确显示不可用。 |
| service-events / C | 业务消息推送：接收模拟服务的任务事件，在消息中心展示进展。 | SSE、重连、乱序和去重、后台生命周期；业务版本较旧时不覆盖新状态。 |
| submission-recovery / D | 提交结果核实：服务已保存但响应丢失时，查询结果并恢复流程。 | submissionId、持久账本、只读核实；恢复不产生第二次业务提交。 |
| team-workbench / D | 团队工作台：把项目、业务任务、多个聊天和进展消息放在一起。 | 多能力组合；解除业务关联不删除宿主聊天或项目。 |
| extension-showcase / D | 扩展能力体验馆：在一个扩展中体验页面、聊天、表单与消息。 | 综合展示与导览，每个体验链接到对应独立示例；技术诊断默认折叠。 |
| message-actions / B | 消息中的业务操作：从进度消息查询办理结果，或确认执行业务操作。 | 最多两个 Operation 按钮、宿主 invocationId、持久状态、回报幂等与双 revision；未知结果核实。 |
| enterprise-auth / B | 企业服务连接：通过宿主连接企业账号，并访问声明的业务服务。 | OIDC PKCE、静默会话查询、变化订阅、断开、资源内 HTTPS 请求；真实 IdP 验收独立记录。 |
| conversation-events / E | 聊天进展观察器：订阅已授权项目的轮次完成事件，记录任务进展。 | 待 M2 支持；事件标识、作用域、去重、恢复及撤权停止投递。 |
| conversation-business-sync / E | 聊天结果同步：将指定轮次的结果同步到模拟工单服务，并通知同步结果。 | 待 M2 事件与轮次读取支持；业务幂等、独立同步状态与最小数据读取。 |

## 4. 消息推送专题

必须区分两条链路，并在 README 首屏明确方向：

1. 当前可实现：业务服务 → 扩展 Node 后台 → 宿主消息中心。
2. 等待 M2：宿主聊天轮次事件 → 扩展 → 业务处理或结果同步。

### 4.1 local-messages：本地消息

用户从扩展页面发布一条虚构任务进展，在宿主消息中心查看，然后返回页面查询、更新和撤回。相同业务事件再次发布时不得产生重复消息。

实现要求：使用 `@ambleloft/extension-sdk/messages-preview`，检测五个真实宿主方法；显示 published、duplicate、rejected、dismissed 对应的真实结果。查询不存在的记录可以返回空；更新与撤回使用当前 revision，冲突后重新查询，由用户决定后续操作。

验收：发布、重复发布、更新、撤回、不存在、revision 冲突、拒收、清除及不支持宿主。接收偏好与已读状态由宿主管理，不虚构扩展控制接口。`remind` 只代表提醒意图，不能写成“系统通知已送达”；系统横幅投递须另行观察。

建议反馈文案：

- published：消息已发布到消息中心。
- duplicate：这条事件已发布，本次未新增消息。
- rejected：宿主拒绝接收这条消息。具体原因以宿主返回信息为准。
- dismissed：这条消息已被清除，本次未重新显示。
- unsupported：当前宿主不支持消息预览接口，其他可用功能仍可继续使用。
- conflict：消息已发生变化。请重新查询后再操作。

### 4.2 service-events：业务消息推送

配套服务只监听本机回环地址，使用虚构数据，须由开发者显式启动。配置服务地址并连接后，发送一条任务事件；再次发送相同事件、更新版本和撤回事件，观察消息中心变化。

业务事件使用稳定事件标识、任务标识与递增版本；这些是示例服务的协议，不是宿主 SDK 字段承诺。页面不建立 SSE 连接，同一扩展后台只保留一个有效连接。

验收：正常推送、同版本重复、旧版本乱序、更高版本更新、撤回、断线重连、配置变化、两窗口、停用和卸载释放连接。设置事件大小与队列上限。收到事件后持久化处理意图，崩溃后提供核对路径；不宣称跨系统恰好一次交付，不自动重放未知写入。

建议反馈文案：“已连接演示服务”“连接已中断，正在重连”“事件已接收，消息发布失败”“处理结果待核对”。连接成功、事件接收和消息发布是三个独立状态。

### 4.3 message-actions：消息操作与结果回报

复用现有 extension-lab/action-service 和宿主 notification-auth 的契约。每条消息最多两个 actions，commandId 必须为本扩展且允许 page 调用的 Operation；参数由宿主从有效消息中读取并按 Schema 校验。写按钮每次经宿主确认，不沿用普通写操作免确认记录。

通过 `invocation.message.invocationId` 取得宿主身份。业务服务将其作为持久幂等键，扩展使用 `listActionInvocations` 核对、`reportActionResult` 显式回报。handler 返回不等于业务完成；accepted、completed、failed、unknown 必须来自真实业务状态。相同 reportId 同内容可重试回报，不能重新执行远端业务；执行记录和消息分别有 revision，原子更新冲突时两者都不能被假报为成功。

验收包括双击/两窗口、accepted 锁、写后丢响应、回报重试、同 reportId 不同内容、双 revision 冲突、prepared/dispatching 重启恢复、撤回/过期/清除、扩展更新及撤权。completed 不自动将消息业务状态置为 resolved，须显式更新；不自动重放业务写入。

兼容检测须区分基础消息与动作：当前 getMessages 初始化只检查原五个方法，两个动作方法调用在旧宿主返回 UNSUPPORTED。因此 getMessages 成功不等于 actions 可用；源码 doctor 也不能证明已安装宿主支持。旧宿主降级为无按钮消息并保留页面查询入口。

### 4.4 enterprise-auth 与 extension-icons

认证案例声明 authentication.resources，连接只能经 page Operation 的 invocation.authentication.requestSession 发起，建议 timeoutMs=120000。后台通过 getSession、onDidChangeSessions、disconnect 和 request 使用宿主会话；SDK 不返回令牌。HTTPS 请求局限于声明资源，不支持任意 URL、请求头、Cookie、重定向或 WebSocket 凭据。401、到期、配置或包版本变化需重新连接，不自动刷新令牌。

独立验收：取消授权、错误 issuer/audience/scopes、未连接、过期、401、越界路径、请求期间撤权、包更新、断开；不得泄露其他扩展会话。受控协议测试和真实企业 IdP 部署分开记录。会话变化订阅已经支持，它不是聊天事件订阅。账号作用域消息仍未开放，消息只放演示单号和非敏感状态。

图标使用包内静态 PNG，单图或 light/dark 配对；正方形 16–512px、每图最多 64KiB，推荐 128px。验收侧栏、首页卡片、设置列表、详情，以及跟随系统、缺失/非法文件、更新移除图标回退。没有动态 setIcon API。

## 5. 聊天事件订阅专题：M2 待实现

### 5.1 conversation-events：聊天进展观察器

目标流程：用户选择并授权项目 → 启用订阅 → 在该项目完成一轮聊天 → 扩展收到事件 → 持久化进展记录 → 页面显示关联任务、聊天引用及处理状态。

首个版本聚焦轮次完成事件，其他生命周期事件必须等待契约明确后再增加。观察器不默认读取聊天正文，不自动调用模型生成摘要。

实施前置条件：

- 宿主与 SDK 明确清单订阅声明、事件类型、payload、handler 注册和支持检测方式。
- 明确项目授权、事件与对应轮次的稳定引用、版本，以及可读取字段。
- 落实持久投递、确认、重试、恢复、撤权和禁用处理；不能直接连接内部 UI publish 或模型引擎事件充当公开接口。
- 明确失败记录、手动重试和投递缺口的可观察方式。

M2 设计目标为至少一次投递：同一 eventId 可能重复，扩展必须幂等；handler 成功返回表示确认。延后处理前先持久化；失败、超时或进程退出进入有限重试；重启恢复已启用、已授权订阅的未确认事件。主动禁用或撤权停止投递并清理对应待处理事件，重新启用不自动补历史。这些是验收目标，不代表现有 SDK 已实现。

验收矩阵：正常完成、未授权项目隔离、重复事件、处理失败、持久化前后崩溃、宿主重启、撤权、禁用后重新启用、队列耗尽与失败记录。逐项记录实际投递和业务处理次数。事件排序、版本与重试参数以最终公开契约为准。

规划期文案：聊天事件订阅正在规划，需宿主与 SDK 提供 M2 接口后才能运行此案例。

### 5.2 conversation-business-sync：聊天结果同步

目标流程：接收完成事件 → 按授权读取事件对应轮次的必要字段 → 向本机模拟工单服务写入结果 → 持久化同步状态 → 发布同步结果消息。

此案例不读取完整聊天历史，不把事件接收成功写成业务同步成功。服务使用持久幂等账本，并提供只读结果查询；记录待处理、已同步、明确失败和结果未知。写后丢响应时先核实；相同事件重投或宿主重启不产生重复业务记录。事件投递确认和业务同步状态分别管理；若先确认事件，必须已经持久保存后续工作。

验收：最小字段读取、轮次版本一致、业务服务离线、写后丢响应、重复事件、重启恢复、消息发布失败、处理期间撤权，以及手动核实与补偿路径。已同步数据的撤销规则由示例明确说明，不能把取消等待解释为业务撤销。

此案例不依赖自动启动主 Agent；若未来增加 AI 摘要，须另列提示词作业能力、预算和授权前提。

## 6. 旗舰案例：expense-workflow

### 6.1 定位与范围

这是首要业务案例，作为官网首屏演示、开发者业务接入参考和可靠提交的验收样板。核心承诺是“从一句报销需求，到一张可核实的报销单”。它是模拟报销业务，不代表已经接入公司财务、完成审批或支付。

已有 expense 模板仅包含三步静态表单、四个 Operation（saveDraft、lookupDraft、submitExpense、lookupExpense）和 SQLite 模拟服务。新增首页、记录列表、状态查询、消息和认证属于本案例待开发内容，不能从宿主能力已存在推断它们已在 expense 中实现。

默认本机演示不要求企业账号、不强制项目绑定，提供虚构数据。企业认证作为显式选择的独立接入模式/构建配置，不能直接把回环 HTTP 地址塞给宿主 HTTPS 认证代理；更换声明后重新构建安装。普通体验与开发者故障注入入口分开。

### 6.2 交付里程碑

| 里程碑 | 交付内容 | 进入下一步的条件 |
| --- | --- | --- |
| F0：核心闭环，P0 | 独立可安装包、三步表单、SQLite 服务、单号与查询、写后丢响应恢复、清晰文案和基础图标 | 干净安装及核心矩阵通过；与阶段 A 同步优先推进 |
| F1：产品体验，P0 | 首页含服务状态、办理入口说明、最近记录、结果查询、草稿/已提交/待核实的真实状态；演示脚本、截图和双语文档 | 用户无需理解 submissionId 即可完成正常和异常流程 |
| F2：消息闭环，P1 | 提交后本地进度消息、只读“查询进度”按钮；可选“撤回申请”写操作和模拟审批事件 | 先实现服务状态及撤回规则，再接消息 actions；重复操作不重复写入 |
| F3：企业接入，P1 | 宿主 OIDC 连接、资源内 HTTPS 业务适配、过期/撤权处理、部署指南 | 受控测试通过；真实 IdP 未验收时明确 blocked/not-run |

F0/F1 是首批旗舰必交付；F2/F3 不能阻塞无账号核心体验。submission-recovery 复用旗舰服务和故障协议，作为独立教学包装，核心恢复验证不得延期到阶段 D。

### 6.3 用户流程与演示故事

固定故事：上海客户拜访，CNY 1,280.00，说明“高铁往返 680 元，酒店 600 元”。现有表单仅总金额与说明，不能宣传结构化费用明细；日期由用户明确填写。

1. 安装并信任扩展；显式启动模拟服务、保存配置。首页说明连接状态和下一步，不把扩展启用当服务已启动。
2. 在聊天输入“我要报销去上海拜访客户的差旅费，总计 1280 元”。Agent 根据 Skill 选择表单，用户核对所有预填项。
3. 行程：选择地区和日期；“保存行程并继续”经宿主确认创建业务草稿。页面自动保存只是宿主草稿。
4. 费用：填写金额和说明；金额保持十进制字符串，扩展与服务做最终校验。
5. 核对：明确提醒检查前两步、勾选确认并提交。汇总 UI 只有在现有表单契约支持时使用；没有支持则依靠前后步骤核对或只读详情，不能虚构动态模板绑定。
6. 成功后展示真实报销单号、金额及“已提交至模拟服务”。用户可以只读查询同一单据；提交不等于审批通过。
7. 异常演示：服务提交成功但故意丢响应，界面显示待核实；用户点击“核实提交结果”，恢复原单号，账本证明只提交一次。
8. F2 演示：模拟服务推进状态，消息更新；从消息查询进度。可选撤回只对服务允许状态生效，已处理单据返回明确冲突。

不新增“打开原表单继续”按钮，除非宿主提供相应公开入口。已有聊天内实例由宿主保存/展示；直接 forms_resume、模板迁移仍未开放。首页不自动拉起表单或运行 Agent；如后续加入项目聊天入口，须用户选择项目并单独授权。

### 6.4 业务与可靠性设计

- 区分宿主表单草稿、服务业务草稿、正式单据、消息执行记录四种身份。form.submissionId 由宿主产生，消息动作使用 message.invocationId；二者不能替换或由页面伪造。
- 每个写入使用持久幂等账本，业务结果和成功账本同事务落盘。相同草稿重复提交相同内容返回原单号；改变已提交内容返回冲突。
- 读取恢复只用原 submissionId，不要求新的 form 上下文。没有记录、查询超时或 503 均不能推断未执行。
- 取消等待不撤销写入；返回上一步不删除服务草稿。修改行程生成新草稿时明示旧草稿保留。
- F1 记录列表通过服务新增只读接口实现，不从聊天历史猜单据；分页、响应大小和错误反馈有界。模拟数据状态与真实账本一致。
- F2 将“业务提交成功、消息发布失败”作为可见的独立状态，不重新提交报销以补发消息。消息内容最小化，不包含行程详情、账号或令牌。
- F2 撤回需要服务端状态检查、独立幂等键与结果查询；不能沿用仅接受 form 的 submitExpense handler 处理消息调用。
- F3 令牌仅由宿主管理。认证 HTTP 返回非 2xx 必须按业务结果处理，401 引导重连；会话失效不能触发自动写重试。

### 6.5 旗舰文案

| 位置/状态 | 中文 | English |
| --- | --- | --- |
| 名称 | 差旅报销助手 | Travel Expense Assistant |
| 简介 | 在聊天里填写、核对并提交报销，随时核实办理结果。 | Fill out, review, and submit an expense claim in chat, then check its status. |
| 演示标识 | 本机演示，使用虚构数据，不提交到真实财务系统。 | Local demo with fictional data. Nothing is sent to a real finance system. |
| 服务未启动 | 尚未连接演示服务。请按运行说明启动服务，再检查连接。 | Demo service is unavailable. Start it using the setup guide, then check the connection. |
| 行程确认 | 保存行程并继续 | Save itinerary and continue |
| 提交 | 确认并提交报销 | Confirm and submit claim |
| 成功 | 报销单 {id} 已提交至模拟服务，可查询后续状态。 | Claim {id} was submitted to the demo service. You can now check its status. |
| 结果未知 | 暂时无法确认是否提交成功。请先核实结果，避免重复提交。 | We could not confirm the submission. Check its result before submitting again. |
| 核实 | 核实提交结果 | Check submission result |
| 已存在 | 这张报销单已提交，本次未新增单据。 | This claim was already submitted. No new claim was created. |
| 消息失败 | 报销已提交，但进度消息未发布。你仍可在记录中查询结果。 | The claim was submitted, but its notification could not be published. Check the result in your records. |
| 认证到期 | 企业连接已失效。请重新连接后查询结果；已有提交不会自动重试。 | Your enterprise connection has expired. Reconnect to check the result. Existing submissions will not be retried automatically. |

文案仅在对应状态获得真实证据后显示。成功提示不能用于 unknown；现有宿主固定按钮无法由扩展改名时以宿主为准，在教程解释，不承诺截图与建议文案完全一致。

### 6.6 旗舰验收矩阵

| 组别 | 必测情形 | 通过条件 |
| --- | --- | --- |
| F0 正常流程 | 全新安装、配置、三步填写、确认提交、查询 | 单号与持久账本一致；只有一次正式提交 |
| F0 校验 | 空日期、非法地区、零/负数/越界/超精度金额、空说明、未勾选 | 确定性拒绝；非法数据无业务写入 |
| F0 确认边界 | 取消确认、返回上一步、修改行程、停止等待 | 不误称业务撤销；展示真实草稿和执行状态 |
| F0 幂等 | 双击、同 submissionId 重放、新 submissionId 提交同草稿、修改已提交内容 | 不重复建单；不兼容写入返回冲突 |
| F0 恢复 | reject、drop、hold、cancel、查询失败、数据库重启 | succeeded/notExecuted/unknown 与账本相符；核实不再次写入 |
| F1 生命周期 | 关闭重开、宿主重启、停用、撤权、更新模板、服务离线 | 不自动重放或迁移；旧实例行为符合宿主限制 |
| F1 可用性 | 页面/表单双语边界、深浅色、键盘焦点、空列表、错误及长内容 | 文案明确、状态可辨、界面无截断；只中文模板如实标注 |
| F2 消息 | 重复/乱序事件、更新失败、按钮双击、写确认、回报冲突、重启 | 单据与消息状态独立；回报不重执行业务 |
| F3 认证 | 未登录、取消、401、到期、越界、撤权、更新包 | 不泄露令牌或跨资源数据；按需重连、不重试未知写入 |

交付截图至少包括：首页/服务状态、行程、费用、核对、提交成功、待核实及恢复同一单号；F2 增加消息与按钮状态；F3 增加连接与失效提示。正常流程与异常恢复各提供逐步演示脚本、操作日志、脱敏账本计数。真实桌面与模拟模型证据明确标注，不能称真实财务或生产 IdP 验收。

暂不列为必交付：发票附件/OCR、动态选项、复杂分支审批、自动付款、自动聊天摘要、远程表单迁移。MCP Apps 可作为只读单据详情的后续增强，不能取代核心可靠提交路径。

### 6.7 仓库交付顺序

| 阶段 | 范围 | 完成标准 |
| --- | --- | --- |
| A：基础与旗舰核心 | 三个入门案例、catalog/CI；同步启动 expense F0 | 入门可复现；旗舰三步与恢复不延期 |
| B：旗舰优先 | expense F1→F2→F3；declarative-intake、mcp-apps-card；message-actions、enterprise-auth 从旗舰抽取最小教学案例 | 首批六例以 F0/F1 为完成门槛；F2/F3 独立报告 |
| C：专题扩展 | 剩余基础案例、extension-icons、local-messages、service-events | 逐个验收，预览能力检测和失败状态清楚 |
| D：组合展示 | submission-recovery 教学包装、team-workbench、extension-showcase | 复用已验证核心；体验馆导向旗舰和专题源码 |
| E：事件闭环 | conversation-events、conversation-business-sync | 公开契约及宿主支持到位后开发 |

## 7. 工程组织与依赖

```text
README.md / README.zh-CN.md
LICENSE / CONTRIBUTING.md / SECURITY.md
catalog.json
docs/compatibility.md
docs/gaps.md
scripts/{build-all,validate-all,check-catalog}.mjs
.github/workflows/ci.yml
<sample>/
  README.md / README.zh-CN.md
  package.json / package-lock.json
  extension.json / extension.nls*.json
  src/ / web/ / scripts/
  tests/ / screenshots/
  mock-service/                 # 仅有外部业务依赖的案例
```

每个可运行案例独立安装与构建，不依赖相邻源码或宿主 node_modules。默认提供 npm 公开包安装路径，版本固定到验收版本并提交 lockfile；教程可介绍 `npm create ambleloft-extension@alpha`，复现与 CI 使用精确版本。create 默认安装依赖，--skip-install 跳过；旧 amble-extension init 只生成文件，不自动安装。

本地未发布改动和离线验证保留显式 SDK_TARBALL_DIR 路径，校验 SDK/core/CLI 版本；不能混用公开包与未记录本地契约。用户安装普通样例不需要访问私有宿主源码。源码 doctor 是贡献者可选检查，matched 也必须记录 runtimeStatus=not-tested。

SDK/CLI 现采用工具库自有许可并保留历史 Apache 权利；samples 自身许可证须明确，复制模板、SDK 运行时代码与第三方依赖时保留对应声明。不能默认把整个工具库重新按 Apache 分发。

每个可运行案例提供 build、validate、pack、test。产物为 `dist/package`，归档放在其外部；仅打包运行所需文件，不能包含秘密、缓存和完整开发依赖。宿主安装不执行 npm install。规划中案例不提供伪装成功的空脚本。

复用现有 project-card、task-form、expense、team-lab、extension-lab 中已验证的逻辑，但应拆出最小依赖、统一命名，并独立验收。既有模板通过不等于新仓库案例通过。

## 8. README 与界面文案规范

README 固定顺序：目标与截图 → 支持状态和前置条件 → 构建安装 → 体验步骤 → 成功结果 → 权限与实现说明 → 失败与恢复 → 清理 → 兼容及验收记录。

必须说明清单与 handler 的对应关系、Node/扩展首页/MCP Apps 卡片的边界、依赖如何进入产物。适用案例同时提供页面入口与可复制的 Agent 提示词；提示词是使用示例，不能承诺模型每次调用顺序完全一致。

文案要求：

- 标题说明用户任务，简介说明输入、动作和结果。用户页面不堆 SDK、IPC、CAS 等术语；技术细节放开发说明。
- 按钮写明确动作，如“创建聊天草稿”“打开原聊天”“发布消息”“核实提交结果”。
- “已创建草稿”不能写成“Agent 已开始执行”；“已保存本地记录”不能写成“已提交财务系统”。
- 明确区分取消等待、取消确认和业务撤销。结果未知时写：“暂时无法确认是否提交成功。请先核实结果，避免重复提交。”
- 错误说明发生了什么、当前状态和下一步；保留真实错误码供诊断，不从文本猜测错误码。
- 中英文目标、限制、命令与成功标准一致；源代码标识保持不变。中文使用“扩展”“宿主”“聊天草稿”“业务任务”等统一术语。
- 仅真实验收过的版本和平台可以写“已验证”；不使用“一键接入所有系统”“实时保证送达”“自动安全重试”等无法证明的表述。

可复制的案例提示词：

| 案例 | 提示词 |
| --- | --- |
| hello-operation | 用文本统计扩展统计下面这段文字的字数和行数：…… |
| project-card | 用项目卡片扩展查看当前已授权项目的名称和说明。 |
| declarative-intake | 展示团队活动信息收集表单，我来填写人数、日期和地区。 |
| mcp-apps-card | 用差旅卡片登记去上海的行程，金额 1200 元。 |
| expense-workflow | 用差旅报销扩展报销差旅费。 |

## 9. 验收与证据

每个案例记录版本、操作步骤、预期、实际结果与证据路径。结果分为 passed、failed、blocked、unsupported、not-run，不能把未执行算通过。

- 在仓库外干净目录验证独立安装；离线包安装测试需显式准备锁定依赖及 tarball，不能假设空缓存可联网取包。
- 完成类型检查、清单和文件语义校验、针对关键行为的测试，以及归档再次校验。
- 每个可运行案例完成真实桌面安装 → 信任 → 授权 → 使用 → 卸载；保存脱敏截图与日志。浏览器 mock 只作为开发辅助。
- 验证权限拒绝、project scope 不匹配、非法输入、取消、服务离线和未知写入；测试项目只使用虚构数据。
- npm 数据转换案例安装后断网仍可处理本地输入，宿主不临时安装依赖。
- 消息、表单恢复与 M2 案例按专题矩阵额外验收。
- 页面覆盖中英文、浅深色、键盘与焦点和错误状态；表单文本若仅中文须明确标注，不能宣称自动本地化。
- 公共生命周期验收包括开发目录加载、按需与 startup 激活、停用释放资源、升级新增权限不自动授权、手动回退及 README 渲染；回退代码不等于回滚业务数据。
- README 命令逐条执行。系统通知、其他操作系统或第三方 MCP Apps 宿主未观察时标记 not-run。

## 10. 目录数据与官网联动

`catalog.json` 每项包含：id、title.zh/en、summary.zh/en、phase、status、apiMaturity、sourceUrl、docsUrl、permissions、sdkVersion、testedHostCommit、screenshot、tags、prerequisites、limitations、verification。

状态采用两个独立维度，避免把“预览 API”误解为“未经测试”：

- status：planned（未交付可运行案例）、preview（可运行但未完成本案例验收）、verified（在记录的基线上完成验收）。
- apiMaturity：developer-preview、experimental、proposed。verified 不表示 API 已稳定。

规划项允许源码、截图和验收字段为空，并显示缺失前提；verified 项必须包含真实来源、文档、截图和结构化验收信息。verification 记录日期、平台、结果与报告路径；本地基线差异写入兼容记录。CI 校验双语字段、状态约束和本地文件引用。

官网只将 verified 展示为“已验证”，并保留 API 预览标签。源代码未发布时显示“查看规划”，不生成无效下载按钮；M2 案例明确显示“等待宿主支持”。官网介绍必须链接到具体案例证据。

需求书以 `ambleloft-web/docs/ambleloft-extension-samples-brief.md` 为维护源，`public/ambleloft-extension-samples-brief.md` 为内容一致的下载副本。构建生成 dist 副本，不手工维护第三份正文。samples 仓库建立后在其 README 链接需求源或明确迁移唯一维护位置。

## 11. 交付执行说明

实施者先核对契约和可追溯基线，初始化仓库目录、兼容记录、双语 catalog 和 CI，然后交付阶段 A 入门三例，同时优先启动 expense F0；阶段 B 以 expense F1 为首要目标，F2/F3 独立推进。按各案例的真实功能裁剪既有模板，不将体验馆整包复制为每一个案例。每阶段提交源码、可复现命令、归档、截图、验收报告与缺口清单。

聊天订阅案例先记录公开接口缺口，不使用内部事件桥接、虚构 SDK 方法或模型调用模拟完成状态。GitHub 创建和推送应在实际实施任务中执行，并验证目标仓库与发布结果；本需求草案的更新不代表代码已经发布。

## 12. English handoff summary

Build an independent Ambleloft Extension Samples repository with focused tutorials and complete business examples. Start with six samples in two stages: hello-operation, project-card, npm-data-transform; then declarative-intake, mcp-apps-card, and expense-workflow.

The inspected SDK/CLI workspace is 0.1.0-alpha.7, with manifest 1.0-draft and host API 1. npm registry queries on 2026-10-08 independently confirmed SDK, CLI, and initializer alpha tags at 0.1.0-alpha.7. The tooling workspace contains uncommitted changes, so its HEAD alone is not a reproducible baseline. Record reproducible source baselines before implementation. Each runnable sample needs independent dependencies, bilingual documentation, build/validate/pack/test commands, explicit permissions, failure handling, and real desktop evidence.

Distinguish service-to-extension notifications from host conversation events. Local messages use a runtime-detected preview API. SSE is a sample business protocol. Conversation event subscriptions and versioned turn reads remain M2 prerequisites; do not expose internal runtime events as a public extension API.

Plan a conversation progress observer and a conversation-to-ticket synchronization sample once those contracts are available. Verify duplicate delivery, persistence, restart recovery, permission revocation, business idempotency, and uncertain write outcomes. Never automatically retry an unknown write or equate event acknowledgement with successful business synchronization.

Use clear task-oriented copy, separate planned/preview/verified sample status from API maturity, and link website claims to actual verification evidence. Keep this document and its public download copy identical.

Prioritize expense-workflow as the flagship. Ship the no-account local flow and durable submission recovery first (F0/F1), then add business notifications/actions (F2) and host-mediated enterprise authentication (F3). Those integrations are planned sample work, not existing expense-template functionality. Add focused message-actions, enterprise-auth, and extension-icons samples, bringing the catalog to 25 planned entries. Current public previews include OIDC resource sessions, bounded HTTPS requests, persistent message action results, packaged icons, npm create, and source-only doctor diagnostics. Conversation hooks and direct form resume/presentation APIs remain unavailable.
