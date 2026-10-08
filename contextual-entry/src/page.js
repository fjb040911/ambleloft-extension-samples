import { createClient, unwrap } from '@ambleloft/extension-sdk/webview';
const cfg = {
  id: 'samples.contextual-entry',
  title: '条件入口',
  en: 'Conditional entry',
  summary: '关联任务后显示额外入口，解除关联后隐藏。',
  summaryEn: 'Show an extra command after linking a task; hide it after unlinking.',
  fields: [],
  buttons: [
    { op: 'link', label: '关联任务 / Link', args: { linked: true } },
    { op: 'link', label: '解除关联 / Unlink', args: { linked: false } },
  ],
  auto: null,
  chat: false,
};
let client,
  project = null,
  controller = null,
  last = null;
const el = (id) => document.getElementById(id);
let en = false;
const localize = (h) => {
  en = !h.locale.toLowerCase().startsWith('zh');
  document.documentElement.dataset.theme = h.theme;
  document.documentElement.lang = en ? 'en' : 'zh-CN';
  el('title').textContent = en ? cfg.en : cfg.title;
  el('intro').textContent = en ? cfg.summaryEn : cfg.summary;
};
const result = (value) => {
  last = value;
  el('result').textContent = JSON.stringify(value, null, 2);
  el('status').textContent = en ? 'Operation completed.' : '操作已完成。';
};
function input() {
  const out = {};
  for (const f of cfg.fields || []) {
    let v = el(f.key).value;
    if (f.type === 'number') v = Number(v);
    if (f.type === 'json') v = JSON.parse(v);
    out[f.key] = v;
  }
  return out;
}
async function run(b) {
  const buttons = [...document.querySelectorAll('button')];
  buttons.forEach((x) => (x.disabled = true));
  el('cancel').disabled = false;
  el('status').textContent = en ? 'Working…' : '正在处理…';
  controller = new AbortController();
  try {
    if (b.local === 'secret') {
      result(
        unwrap(
          await client.requestSecretInput({
            key: 'demo-key',
            title: en ? 'Fictional test secret' : '虚构测试密钥',
          }),
        ),
      );
      return;
    }
    if (b.local === 'grant') {
      if (!project) throw Error('请先选择项目 / Choose a project first');
      result({
        granted: unwrap(
          await client.requestGrant({
            projectId: project.id,
            capabilities: ['projects.path.read'],
          }),
        ),
      });
      return;
    }
    if (b.project && !project) {
      project = unwrap(
        await client.selectProject({
          capabilities: [
            'projects.read',
            ...(cfg.chat ? ['conversations.create', 'conversations.open'] : []),
          ],
        }),
      );
      if (!project) {
        el('status').textContent = en ? 'Project selection cancelled.' : '已取消选择项目。';
        return;
      }
    }
    const data = {
      ...(b.useInput === false ? {} : input()),
      ...(b.args || {}),
      ...(b.project ? { projectId: project.id } : {}),
    };
    if (b.revision) data.expectedRevision = last?.revision ?? 0;
    const response = unwrap(
      await client.invoke(cfg.id + '.' + b.op, data, { signal: controller.signal }),
    );
    result(JSON.parse(response.data));
  } catch (e) {
    el('status').textContent =
      e.effectStatus === 'unknown'
        ? en
          ? 'The result is unknown. Check before retrying.'
          : '结果待核实。请先查询结果，不要重复提交。'
        : (e.code ? e.code + ': ' : '') + e.message;
  } finally {
    controller = null;
    buttons.forEach((x) => (x.disabled = false));
    el('cancel').disabled = true;
  }
}
for (const f of cfg.fields || []) {
  const label = document.createElement('label');
  label.htmlFor = f.key;
  label.textContent = f.label;
  el('fields').append(label);
  const field = document.createElement(
    f.type === 'textarea' || f.type === 'json' ? 'textarea' : 'input',
  );
  field.id = f.key;
  if (field.tagName === 'INPUT') field.type = f.type || 'text';
  field.value = f.value ?? '';
  el('fields').append(field);
}
for (const b of cfg.buttons) {
  const button = document.createElement('button');
  button.textContent = b.label;
  button.dataset.operation = b.op || b.local;
  button.addEventListener('click', () => run(b));
  el('buttons').append(button);
}
el('cancel').onclick = () => controller?.abort();
(async () => {
  try {
    client = createClient();
    localize(await client.initialize());
    const sub = client.onHostContextChanged(localize);
    window.addEventListener(
      'pagehide',
      () => {
        sub.dispose();
        controller?.abort();
      },
      { once: true },
    );
    el('status').textContent = en
      ? 'Ready. Use fictional sample data.'
      : '已就绪。请使用虚构演示数据。';
    if (cfg.auto) await run(cfg.auto);
  } catch (e) {
    el('status').textContent = '请在 Ambleloft 中打开此扩展 / Open this extension in Ambleloft.';
    document.querySelectorAll('button').forEach((b) => (b.disabled = true));
  }
})();
