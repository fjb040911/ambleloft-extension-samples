import { createClient, unwrap, type HostContext } from '@ambleloft/extension-sdk/webview';
const client = createClient();
let en = false;
let statusKind: 'ready' | 'checking' | 'connected' | 'error' = 'ready';
let statusDetail = '';
function renderStatus() {
  const copy = {
    ready: ['已连接宿主，可以检查演示服务。', 'Ready to check the demo service.'],
    checking: ['正在查询…', 'Checking…'],
    connected: ['演示服务已连接。', 'Demo service connected.'],
    error: [
      '暂时无法查询。请检查 serviceUrl 配置并启动演示服务。 ',
      'Unable to query. Check serviceUrl and start the demo service. ',
    ],
  };
  $('status').textContent = copy[statusKind][en ? 1 : 0] + statusDetail;
}
function setStatus(kind: typeof statusKind, detail = '') {
  statusKind = kind;
  statusDetail = detail;
  renderStatus();
}
const $ = (id: string) => document.getElementById(id)!;
const original = new Map<HTMLElement, string>();
document.querySelectorAll<HTMLElement>('[data-en]').forEach((e) => original.set(e, e.innerHTML));
function theme(h: HostContext) {
  en = !h.locale.startsWith('zh');
  document.documentElement.dataset.theme = h.theme;
  document.documentElement.lang = en ? 'en' : 'zh-CN';
  for (const [e, text] of original) {
    if (en) e.textContent = e.dataset.en!;
    else e.innerHTML = text;
  }
  renderStatus();
}
async function call(op: string) {
  const buttons = [...document.querySelectorAll('button')];
  buttons.forEach((b) => (b.disabled = true));
  setStatus('checking');
  try {
    const value = unwrap(await client.invoke('samples.expense-workflow.' + op, {}));
    setStatus('connected');
    if (op === 'records') {
      const rows = value.records as Array<Record<string, string>>;
      $('records').replaceChildren();
      if (!rows.length) {
        const p = document.createElement('p');
        p.textContent = en
          ? 'No claims yet. Start with the prompt above.'
          : '还没有报销记录。请使用上方提示词开始办理。';
        $('records').append(p);
        return;
      }
      const table = document.createElement('table');
      const head = table.createTHead().insertRow();
      for (const label of en
        ? ['Claim', 'Destination / date', 'Amount', 'Status']
        : ['报销单号', '行程 / 日期', '金额', '状态']) {
        const th = document.createElement('th');
        th.textContent = label;
        head.append(th);
      }
      const body = table.createTBody();
      for (const r of rows) {
        const tr = body.insertRow();
        for (const v of [
          r.id,
          `${r.region === 'shanghai' ? (en ? 'Shanghai' : '上海') : en ? 'Beijing' : '北京'} · ${r.date}`,
          `CNY ${r.amount}`,
          en ? 'Submitted' : '已提交',
        ])
          tr.insertCell().textContent = v;
      }
      $('records').append(table);
    }
  } catch (e) {
    setStatus('error', e instanceof Error ? e.message : '');
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
}
$('check').onclick = () => void call('status');
$('refresh').onclick = () => void call('records');
client
  .initialize()
  .then((h) => {
    theme(h);
    const sub = client.onHostContextChanged(theme);
    window.addEventListener('pagehide', () => sub.dispose(), { once: true });
    setStatus('ready');
  })
  .catch(() => {
    $('status').textContent = '请在 Ambleloft 中打开此扩展 / Open in Ambleloft';
    document.querySelectorAll('button').forEach((b) => (b.disabled = true));
  });
