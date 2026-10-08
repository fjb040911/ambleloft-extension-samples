import {
  createClient,
  unwrap,
  type JsonObject,
  type HostContext,
} from '@ambleloft/extension-sdk/webview';
const zh = {
  title: '团队任务演示',
  intro: '项目、聊天与进展，保存在你的本地工作台。',
  projects: '项目与聊天',
  empty: '还没有任务。先选择一个本地项目并授权。',
  taskTitle: '任务名称',
  add: '选择项目并关联任务',
  tasks: '当前任务',
  summary: '查看摘要',
  removeTask: '解除任务关联',
  newChat: '新建聊天',
  chatTitle: '聊天标题',
  prompt: '初始内容',
  create: '新建并打开聊天',
  createHint: '每次新建都保留原有聊天。创建不会调用模型，发送由宿主确认。',
  pending: '上次创建结果待核对。请先在宿主检查，避免重复创建。',
  ack: '我已核对，允许再次新建',
  linkedChats: '已关联聊天',
  selectChat: '选择聊天',
  open: '打开已有聊天',
  unlink: '解除聊天关联',
  archiveHint: '归档状态由宿主展示。无法打开时可解除关联，或明确新建；不会自动替换。',
  notices: '本地通知',
  event: '业务事件标识',
  noticeTitle: '通知标题',
  body: '通知正文',
  publish: '发布进展',
  query: '查询',
  update: '更新内容',
  withdraw: '撤回',
  preferences: '接收偏好',
  noticeHint: '从宿主侧栏铃铛进入消息中心。已读、清除、静音和接收设置由宿主管理。',
  service: '服务连接',
  connect: '连接演示服务',
  disconnect: '断开',
  serviceHint:
    '可选：运行 npm run service，在扩展设置填写 http://127.0.0.1:47831/events。未启动服务也能使用本地功能。',
  settings: '生效配置',
  settingsHint: '设置 → 扩展 → 团队任务演示 → 扩展设置。恢复默认值会清除配置，采用应用自身默认值。',
  account: '账号登录：待宿主支持。',
  runtime: '运行信息',
  refresh: '刷新状态',
  developer: '开发者验收与技术回执',
  safeHint: '仅输入虚构测试密钥。安全字段由宿主显示，页面不会收到密钥内容。',
  secretInput: '输入测试密钥',
  secretStatus: '检查密钥是否存在',
  secretDelete: '删除测试密钥',
  kv: '验证 KV 空值与版本',
  path: '读取授权项目路径',
  cancel: '取消当前等待',
  footer: '本地消息预览 · 通知动作与认证待支持，系统提醒需平台验证',
  working: '等待宿主授权或执行…',
  ready: '已更新',
  published: '已发送到消息中心',
  duplicate: '已存在，未重复发布',
  rejected: '用户已关闭接收',
  dismissed: '已清除，不会重新出现',
  invisible: '当前无可见通知',
  first: '请先查询当前事件',
  grant: '请通过选择项目完成授权，然后刷新。',
  unavailable: '此宿主没有本地通知接口',
  unknown: '结果未知，请先核对。不会自动重试。',
  failed: '操作未完成，请检查授权或刷新后重试。',
  cancelled: '已取消；已经发生的操作不会自动撤销。',
};
const en: typeof zh = {
  title: 'Team Tasks Demo',
  intro: 'Projects, conversations and progress in your local workspace.',
  projects: 'Projects & conversations',
  empty: 'No tasks yet. Choose a local project and grant access.',
  taskTitle: 'Task name',
  add: 'Choose project & link task',
  tasks: 'Current task',
  summary: 'View summary',
  removeTask: 'Unlink task',
  newChat: 'New conversation',
  chatTitle: 'Conversation title',
  prompt: 'Initial content',
  create: 'Create & open conversation',
  createHint:
    'Each new conversation keeps previous links. Creating does not run a model; send in the host.',
  pending: 'The previous creation outcome is uncertain. Check the host before creating again.',
  ack: 'I checked; allow another creation',
  linkedChats: 'Linked conversations',
  selectChat: 'Choose conversation',
  open: 'Open existing conversation',
  unlink: 'Unlink conversation',
  archiveHint:
    'The host handles archived conversations. Unlink unavailable references or explicitly create another; no automatic replacement.',
  notices: 'Local notifications',
  event: 'Business event key',
  noticeTitle: 'Notice title',
  body: 'Notice body',
  publish: 'Publish progress',
  query: 'Query',
  update: 'Update content',
  withdraw: 'Withdraw',
  preferences: 'Preferences',
  noticeHint:
    'Use the host sidebar bell for Message Center. Reading, clearing, muting and receiving are host settings.',
  service: 'Service connection',
  connect: 'Connect demo service',
  disconnect: 'Disconnect',
  serviceHint:
    'Optional: run npm run service and set http://127.0.0.1:47831/events in Extension Settings. Local features work without it.',
  settings: 'Effective settings',
  settingsHint:
    'Settings → Extensions → Team Tasks Demo → Extension Settings. Reset clears configuration and uses application defaults.',
  account: 'Account login: awaiting host support.',
  runtime: 'Runtime information',
  refresh: 'Refresh state',
  developer: 'Developer checks & technical receipts',
  safeHint:
    'Use fictional test keys only. The host owns the secure field; the page never receives its value.',
  secretInput: 'Enter test key',
  secretStatus: 'Check key presence',
  secretDelete: 'Delete test key',
  kv: 'Verify KV null & revisions',
  path: 'Read granted project path',
  cancel: 'Cancel current wait',
  footer:
    'Local messages preview · Actions and authentication pending; system delivery needs platform verification',
  working: 'Waiting for host authorization or execution…',
  ready: 'Updated',
  published: 'Sent to Message Center',
  duplicate: 'Already exists; not published again',
  rejected: 'Receiving is disabled by the user',
  dismissed: 'Cleared; will not reappear',
  invisible: 'No visible notice',
  first: 'Query the current event first',
  grant: 'Choose a project to grant access, then refresh.',
  unavailable: 'This host has no local message API',
  unknown: 'Outcome unknown. Check before trying again; no automatic retry.',
  failed: 'Not completed. Check access or refresh before retrying.',
  cancelled: 'Cancelled; completed side effects are not undone.',
};
type Task = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  chats: { id: string; title: string }[];
  pending: boolean;
};
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let text = zh,
  client: ReturnType<typeof createClient>,
  tasks: Task[] = [],
  busy = false,
  ready = false,
  available = false,
  current: { id: string; revision: number } | null = null,
  abort: AbortController | undefined;
const task = () => tasks.find((t) => t.id === el<HTMLSelectElement>('tasks').value);
const input = (id: string) => el<HTMLInputElement>(id).value;
const bound = () => ({ projectId: task()!.projectId, taskId: task()!.id });
function options(id: string, items: { id: string; title: string }[]) {
  const select = el<HTMLSelectElement>(id),
    old = select.value;
  select.replaceChildren(...items.map((i) => new Option(i.title, i.id)));
  if (items.some((i) => i.id === old)) select.value = old;
}
function render() {
  document
    .querySelectorAll<HTMLElement>('[data-text]')
    .forEach((n) => (n.textContent = text[n.dataset.text as keyof typeof zh]));
  const selected = task();
  el('empty').hidden = tasks.length > 0;
  el('chat-form').hidden = !selected;
  el('summary').hidden = !selected;
  el('remove-task').hidden = !selected;
  el('project').textContent = selected?.projectName || '';
  el('pending').hidden = !selected?.pending;
  el('ack').hidden = !selected?.pending;
  for (const b of document.querySelectorAll<HTMLButtonElement>('button'))
    b.disabled = busy || !ready;
  for (const id of ['publish', 'query', 'update', 'withdraw', 'preferences'])
    el<HTMLButtonElement>(id).disabled ||= !available;
  el<HTMLButtonElement>('create').disabled ||= !!selected?.pending;
  el<HTMLButtonElement>('open').disabled ||= !input('chats');
  el<HTMLButtonElement>('unlink').disabled ||= !input('chats');
  el<HTMLButtonElement>('path').disabled ||= !selected;
  el<HTMLButtonElement>('cancel').disabled = !busy;
}
function localize(c: HostContext) {
  const previous = text;
  text = c.locale.startsWith('zh') ? zh : en;
  for (const id of ['status', 'notice-result']) {
    const key = (Object.keys(previous) as (keyof typeof zh)[]).find(
      (k) => previous[k] === el(id).textContent,
    );
    if (key) el(id).textContent = text[key];
  }
  document.documentElement.lang = c.locale;
  document.documentElement.dataset.theme = c.theme;
  document.title = text.title;
  render();
}
async function invoke(name: string, input: JsonObject = {}) {
  const result = unwrap(
    await client.invoke('samples.team-workbench.' + name, input, { signal: abort?.signal }),
  );
  if (!result.success) throw Object.assign(new Error(String(result.code)), { code: result.code });
  return JSON.parse(String(result.data));
}
async function refresh() {
  const s = await invoke('status');
  tasks = s.tasks;
  available = s.messagesAvailable;
  options('tasks', tasks);
  options('chats', task()?.chats || []);
  document.documentElement.dataset.density = s.config.density;
  el('runtime').textContent =
    `v${s.version} · ${s.bootId} · ${available ? 'messages-preview' : text.unavailable}`;
  el('effective').textContent =
    `${s.config.density} · ${s.config.limit} · ${s.config.connected ? 'ON' : 'OFF'}${s.configCode ? ' · ' + text.grant : ''}`;
  const labels: Record<string, string> =
    text === zh
      ? {
          connected: '已连接',
          connecting: '正在连接',
          reconnecting: '正在重连',
          disconnected: '已断开',
          unconfigured: '尚未配置服务',
          'invalid-address': '请使用回环地址 /events',
        }
      : {
          connected: 'Connected',
          connecting: 'Connecting',
          reconnecting: 'Reconnecting',
          disconnected: 'Disconnected',
          unconfigured: 'Service not configured',
          'invalid-address': 'Use a loopback /events address',
        };
  el('connection').textContent =
    `${labels[s.connection.state] || s.connection.state} · ${s.connection.lastEvent || '—'} · ${s.connection.received}`;
  render();
  return s;
}
async function act(name: string, work: () => Promise<unknown>) {
  if (busy) return;
  busy = true;
  abort = new AbortController();
  render();
  el('status').textContent = text.working;
  try {
    const value = await work();
    el('receipt').textContent = JSON.stringify({ operation: name, value }, null, 2);
    el('status').textContent = text.ready;
  } catch (e) {
    const error = e as { code?: string; effectStatus?: string };
    el('receipt').textContent = JSON.stringify(
      { operation: name, code: error.code || 'INTERNAL', effectStatus: error.effectStatus },
      null,
      2,
    );
    el('status').textContent =
      error.effectStatus === 'unknown' || error.code === 'OUTCOME_UNKNOWN'
        ? text.unknown
        : error.code === 'CANCELLED'
          ? text.cancelled
          : text.failed;
  } finally {
    busy = false;
    abort = undefined;
    render();
  }
}
el('tasks').onchange = () => {
  options('chats', task()?.chats || []);
  render();
};
el('chats').onchange = render;
el('add').onclick = () =>
  void act('addTask', async () => {
    const project = unwrap(
      await client.selectProject({
        capabilities: [
          'projects.read',
          'projects.path.read',
          'conversations.create',
          'conversations.open',
          'storage',
          'configuration',
          'secrets',
        ],
      }),
    );
    if (!project) return { cancelled: true };
    const result = await invoke('addTask', { projectId: project.id, title: input('task-title') });
    await refresh();
    el<HTMLSelectElement>('tasks').value = result.id;
    options('chats', []);
    return result;
  });
el('remove-task').onclick = () =>
  void act('removeTask', async () => {
    const r = await invoke('removeTask', bound());
    await refresh();
    return r;
  });
el('create').onclick = () =>
  void act('createChat', async () => {
    const b = bound();
    const r = await invoke('createChat', {
      ...b,
      title: input('chat-title'),
      prompt: input('prompt'),
    });
    await refresh();
    el<HTMLSelectElement>('chats').value = r.id;
    await invoke('openChat', { ...b, conversationId: r.id });
    return r;
  });
el('open').onclick = () =>
  void act('openChat', () => invoke('openChat', { ...bound(), conversationId: input('chats') }));
el('unlink').onclick = () =>
  void act('unlinkChat', async () => {
    const r = await invoke('unlinkChat', { ...bound(), conversationId: input('chats') });
    await refresh();
    return r;
  });
el('ack').onclick = () =>
  void act('acknowledgeUnknown', async () => {
    const r = await invoke('acknowledgeUnknown', bound());
    await refresh();
    return r;
  });
el('summary').onclick = () => void act('summary', () => invoke('summary', bound()));
el('path').onclick = () =>
  void act('projectPath', () => invoke('projectPath', { projectId: task()!.projectId }));
el('refresh').onclick = () => void act('status', refresh);
el('cancel').onclick = () => abort?.abort();
el('event').oninput = () => {
  current = null;
};
el('publish').onclick = () =>
  void act('publish', async () => {
    const r = await invoke('publish', {
      eventKey: input('event'),
      title: input('notice-title'),
      body: input('body'),
    });
    el('notice-result').textContent = text[r.status as 'published'];
    return r;
  });
el('query').onclick = () =>
  void act('query', async () => {
    current = await invoke('query', { eventKey: input('event') });
    el('notice-result').textContent = current ? text.ready : text.invisible;
    return current;
  });
for (const name of ['update', 'withdraw'])
  el(name).onclick = () =>
    void act(name, async () => {
      if (!current) {
        el('notice-result').textContent = text.first;
        return null;
      }
      current = await invoke(name, {
        id: current.id,
        revision: current.revision,
        ...(name === 'update' ? { body: input('body') } : {}),
      });
      el('notice-result').textContent = current ? text.ready : text.invisible;
      return current;
    });
el('preferences').onclick = () => void act('preferences', () => invoke('preferences'));
for (const name of ['connect', 'disconnect'])
  el(name).onclick = () =>
    void act('connection', async () => {
      const r = await invoke('connection', { connected: name === 'connect' });
      await refresh();
      return r;
    });
el('secret-input').onclick = () =>
  void act('secureInput', async () =>
    unwrap(await client.requestSecretInput({ key: 'demo-test-key', title: text.secretInput })),
  );
for (const [button, op] of [
  ['secret-status', 'secretStatus'],
  ['secret-delete', 'secretDelete'],
  ['kv', 'kvCheck'],
])
  el(button).onclick = () => void act(op, () => invoke(op));
async function start() {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;
  const dispose = () => {
    stopped = true;
    clearTimeout(timer);
    abort?.abort();
    subscription?.dispose();
  };
  let subscription: { dispose(): void } | undefined;
  window.addEventListener('pagehide', dispose, { once: true });
  try {
    client = createClient();
    localize(await client.initialize());
    if (stopped) return;
    ready = true;
    subscription = client.onHostContextChanged(localize);
    await act('status', refresh);
    const poll = async () => {
      if (stopped) return;
      if (!busy)
        try {
          await refresh();
        } catch {}
      if (!stopped) timer = setTimeout(poll, 2000);
    };
    timer = setTimeout(poll, 2000);
  } catch {
    el('status').textContent = text.failed;
  }
}
void start();
