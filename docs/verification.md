# 验证记录 / Verification

验证日期：2026-10-08。23 个案例可运行，2 个聊天事件案例仅保留规划。所有可运行案例仍标记为 preview；以下结果不代表生产认证、跨平台或所有分支已经验收。

## 环境与依赖

- macOS，Node.js v24.14.1；项目最低 Node.js 22.13.0。
- npm 发布包：`@ambleloft/extension-sdk`、`@ambleloft/extension-cli` 均固定为 `0.1.0-alpha.7`，每个案例提供独立锁文件，不依赖 sibling workspace 或 npm link。
- 宿主源码：`237e8c6746e8e0ed6a17edffe44877a3118068d3`。真实 Electron 宿主，隔离临时用户目录，使用本地确定性模型响应与 SQLite 演示服务。
- 截图来自实际宿主和扩展页面，包含演示数据；不是设计稿，也不是生产业务或真实企业认证的证明。

## 构建与测试

| 检查 | 结果 | 范围 |
| --- | --- | --- |
| 独立安装 | 23 / 23 通过 | 从项目外临时目录执行 npm ci，使用此前从 npm 获取的缓存，未使用本地 SDK 链接 |
| 构建、目录校验、打包、归档再校验 | 23 / 23 通过 | esbuild、适用案例的 TypeScript 检查及官方 CLI |
| 自动化测试 | 30 / 30 通过 | 注册约束、文本处理、CSV、存储版本冲突、MCP 首次保存、报销服务幂等与故障核实 |
| 宿主安装 | 23 / 23 通过 | 实际导入各 .amble-extension 安装包 |
| 主页渲染 | 22 / 22 通过 | MCP 案例由聊天卡片呈现，单独验证 |
| 文档截图 | 50 张 | 中英文 README 引用真实截图 |

独立安装记录：[clean-install.json](evidence/clean-install.json)。首次独立安装在最后一轮样式与状态文案修正前运行；修正后重新构建、打包并检查归档。桌面记录中的归档哈希对应当次运行，最终交付归档见 [final-artifacts.json](evidence/final-artifacts.json)，不要将不同阶段的哈希混用。

## 实际桌面交互

| 案例 | 已验证行为 | 尚未覆盖或边界 |
| --- | --- | --- |
| expense-workflow | 三步报销、正常提交、账本查询、写入后丢响应、只读核实、仅写入一次、深色英文主页 | F2 消息与 F3 企业适配尚未集成；宿主残留错误见下文 |
| submission-recovery | 丢响应后保留 unknown、核实后 completed、账本不重复 | 不推断任何业务写操作都可以自动重试 |
| storage-notebook | 读取、带版本写入 | 版本冲突另有自动化测试 |
| operation-confirmation | 确认创建、读取、确认删除 | 生产权限策略未验收 |
| contextual-entry | 设置上下文键 | 不声称订阅聊天事件 |
| conversation-launcher | 创建并打开会话草稿 | 不自动执行用户未发送的消息 |
| cancellation-and-errors | 取消等待中的只读操作 | 取消不等于回滚业务写入 |
| local-messages | 发布、重复发布查询、更新、撤回 | 未验证真实操作系统通知横幅 |
| message-actions | unknown 后查询与核实成功，业务写入一次 | 使用独立本地服务 |
| service-events | SSE 连接、去重、乱序保护、断开 | 非聊天生命周期事件订阅 |
| declarative-intake | 宿主表单呈现 | 表单模板为中文 |
| mcp-apps-card | 卡片渲染、编辑、确认与保存 | 本地测试模型响应 |
| theme-and-i18n / extension-icons | 深色主题、语言事件、打包图标 | 首次页面语言存在宿主缺口 |
| enterprise-auth | 未连接状态与界面 | 未接入真实企业 IdP，不宣称登录成功 |
| 其他 8 个可运行案例 | 安装、主页渲染；部分只读按钮冒烟检查 | 不等同于每项交互的完整端到端验收 |

详细记录：[基本交互](evidence/desktop.json)、[进阶交互](evidence/desktop-advanced.json)、[外观与语言](evidence/desktop-appearance.json)。三个报告重复安装案例，不应将这些次数累计成独立功能覆盖率。

## 必须保留的限制

1. 新开页面可能收到系统语言而非宿主已保存的语言；真实宿主语言切换事件可以更新现有页面。
2. 报销核实成功后，宿主仍保留旧 `INTERNAL` 错误提示；表单状态和服务账本均已恢复，UI 体验仍有缺口。
3. 聊天事件订阅与 turn 读取尚无可用公开接口，两个相关目录只有需求说明。
4. 真实企业 IdP、Windows/Linux 桌面及生产部署未验证。

原因与边界见 [gaps.md](gaps.md)。CLI 的表单运行时校验提示不是静态构建失败；动态表单行为须由宿主交互验证。

## 复现

```bash
npm ci
npm run setup
npm run build
npm run validate
npm run pack
npm run validate:archives
npm test
node scripts/clean-install.mjs
AMBLE_HOST_PATH=/absolute/path/to/agent npm run test:desktop
AMBLE_HOST_PATH=/absolute/path/to/agent npm run test:desktop -- --advanced
AMBLE_HOST_PATH=/absolute/path/to/agent npm run test:desktop -- --appearance
```

桌面测试要求已安装并构建的 Ambleloft 源码及其 Playwright/Electron 依赖，使用独立临时配置，不读取日常账户数据。普通案例构建只需 npm 发布的 SDK/CLI。
