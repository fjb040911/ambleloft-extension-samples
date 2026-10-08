# 团队任务演示：全场景案例

需求依据 v0.1.0；Demo 0.2.0；SDK/CLI 0.1.0-alpha.7，全部为开发者预览。
保留 team-tasks 入门模板，本模板 team-lab 演示多任务、多聊天、配置、安全输入和本地业务事件。

## 创建、构建与安装

```sh
amble-extension init my-team --template team-lab --publisher acme --name team
cd my-team
npm install
npm run build
npm run validate
npm run pack
```

模板明确依赖 TypeScript、esbuild 和 @types/node，不依赖宿主的 node_modules。
本仓库开发可直接在根目录 npm ci 后 npm run lab:build，安装 dist/team-lab.amble-extension。
宿主「设置 → 扩展 → 安装扩展」选择包并确认代码信任。代码信任不等于资源授权。

## 本地体验

1. 选择项目并授权，填写任务名称。同一项目可关联多项业务任务。
2. 选中任务，填写聊天标题和初始内容，点击“新建并打开聊天”。创建草稿不会运行模型，需在宿主发送。
3. 再次新建会保留旧聊天；下拉框可分别打开 A/B。打开只接受已有 ID，不暗中创建，不自动还原归档。
4. 永久删除的聊天打开失败时，明确解除旧关联或新建。创建结果未知会保留待核对状态；先在宿主核对，再点“我已核对”，绝不自动重试。
5. 发布通知显示四种真实回执：已发送、已存在、关闭接收、已清除。查询后更新/撤回使用当前 revision；冲突后由用户重新查询。
6. 从宿主侧栏铃铛打开消息中心；阅读、清除、拒收和静音由宿主处理，没有伪造的扩展导航 API。
7. 技术回执默认折叠。开发者区演示项目路径、KV 空值/CAS、安全输入、取消。只输入虚构密钥；页面只读存在性，不接收明文。

一项任务解除关联不会删除宿主项目/聊天。任务 ID 是业务身份，项目路径不是身份。
后台注册 Operation 为同步行为；资源方法只在调用作用域使用。Agent 业务操作包括 summary/addTask/projectPath；resourceProbe 仅用于 Agent 页面能力拒绝验收，走同一权限、schema、确认路径。

## 配置与应用默认值

设置 → 扩展 → 团队任务演示 → 扩展设置。schema 声明字段：

| 字段 | 类型 | 应用默认行为 |
| --- | --- | --- |
| serviceUrl | string | 空；不连接 |
| connected | boolean | false |
| density | enum | comfortable |
| limit | 必填 integer，1–100 | 20；任务与每项聊天上限 |
| note | 可选 string | 空 |
| tags | 可选 array[string] | 仅 JSON 表单验收 |

src/config.ts 集中定义默认值和类型检查；未声明 schema.default/title/when。
恢复默认值意味着宿主保存空对象，后台收到空对象后采用上述默认行为。
configuration.onDidChange 只注册一次，注销后停止回调；后台订阅实时应用，页面通过 status 刷新，不伪造配置事件桥。
Node l10n 字典只在激活时建立，不承诺后台运行中语言更新。页面与宿主贡献标签使用各自真实 locale 更新机制。

## 可选本地推送服务

```sh
npm run service
```

仅监听 127.0.0.1:47831，可通过 PORT 环境变量修改端口。配置 serviceUrl 为
http://127.0.0.1:47831/events，connected=true；也可点击页面“连接演示服务”。
手动断开维持到后台停止、用户再次连接或修改连接配置；仅改变布局不会重连，重启后采用持久配置。
业务协议为 HTTP SSE，**不是宿主通用消息订阅接口**。页面不建连接，同一后台只有一个连接。

```sh
curl -X POST http://127.0.0.1:47831/event -H 'Content-Type: application/json' -d '{"eventId":"weekly-ready","taskId":"demo-task","kind":"progress","version":1,"title":"团队进展","body":"初始内容"}'
curl http://127.0.0.1:47831/stats
curl -X POST http://127.0.0.1:47831/disconnect
```

重复同 eventId/version 不再发布；version=3 后送 version=2 不覆盖；更高版本更新原消息；kind=withdraw 撤回。
eventId 是服务范围内稳定业务 ID，taskId 是业务关联元数据。不要将时间戳作为重试的新 eventId。
每次收到事件先持久化最高业务版本/待处理意图，再调用宿主消息 API；进程崩溃或写入失败不自动重放，开发者需核对 intent 与宿主状态。它是保守的演示投递策略，不是恰好一次事务保证。
重连退避 250ms 起、上限 8s；15s 无数据断开重试，服务每 5s 心跳。事件大小、版本、队列累计数量有界。端点仅允许回环 HTTP /events，不接受账号或凭据。
测试控制接口只供本地虚构数据，不连接企业服务；Ctrl+C 关闭连接并释放端口。

## 边界与手工回归

- 关闭页面再开：业务关联保留，不新增聊天或连接。两窗口查看 /stats 应只有一个有效订阅。
- 停用/卸载：连接释放，旧 generation 不可继续写宿主。重启读取配置和 KV。
- 配置未授权返回真实拒绝；安装信任不自动授予 self 资源。加密后端不可用时密钥写入失败，不降级到明文。
- 取消等待不撤销已发生的业务；effectStatus=unknown 提示核对。原始无结构化错误标记 UNSTRUCTURED_HOST_ERROR，不猜文本错误码。
- 认证、非空通知 actions、业务账号消息、Agent 完整回合和通用消息订阅待宿主支持。
- remind 是提醒意图，不是系统横幅投递回执。

验收按宿主 tooling-report/requirement/v0.1.0 的逐例矩阵进行；真实结果见宿主时间目录，未执行项不计 PASS。

开发者验收 Operation（messageProbe/resourceProbe/listenerProbe/rpcProbe/crashProbe）用于真实 API 的非法输入、监听、队列和进程恢复检查，不是 SDK 新能力。crashProbe 经宿主写确认后终止本演示后台；普通页面不提供该按钮。

当前宿主已有 Electron Notification 尝试投递及点击导航路径，但本 Demo/SDK 没有投递成功查询接口。系统权限、横幅、点击与平台可用性必须单独观察；未观察记录 NOT-RUN。
