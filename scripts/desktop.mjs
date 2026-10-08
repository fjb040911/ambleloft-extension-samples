// Test driver only. Private host setup APIs never ship in extension packages.
// Always uses a temporary profile and a local fixture model, never a user account.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.env.AMBLE_HOST_PATH)
  throw Error('Set AMBLE_HOST_PATH to a built compatible Ambleloft host.');
const host = path.resolve(process.env.AMBLE_HOST_PATH),
  require = createRequire(path.join(host, 'package.json'));
const { _electron: electron, expect } = require('@playwright/test');
const own = createRequire(import.meta.url),
  { createService } = own('../expense-workflow/mock-service/server.cjs');
const temp = await mkdtemp(path.join(os.tmpdir(), 'amble-samples-qa-'));
const report = {
  time: new Date().toISOString(),
  node: process.version,
  platform: process.platform,
  model: 'local deterministic Responses fixture',
  profile: 'temporary isolated profile',
  results: [],
  hashes: {},
};
const advanced = process.argv.includes('--advanced'),
  appearance = process.argv.includes('--appearance');
let app,
  page,
  service,
  actionService,
  pushService,
  modelServer,
  port,
  provider,
  toolQueue = [],
  round = 0;
const catalog = JSON.parse(await readFile(path.join(root, 'catalog.json')));
const record = (sample, check, evidence) => {
  report.results.push({ sample, check, status: 'passed', evidence });
  console.log('PASS', sample, check);
};
const until = async (fn, label) => {
  for (let n = 0; n < 200; n++) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error('Timeout: ' + label);
};
const shot = async (slug, name, target = page) => {
  const out = path.join(root, slug, 'screenshots');
  await mkdir(out, { recursive: true });
  await target.screenshot({ path: path.join(out, name + '.png') });
};
const viewCode = (id, code) =>
  app.evaluate(({ webContents }, { id, code }) => webContents.fromId(id).executeJavaScript(code), {
    id,
    code,
  });
async function viewFor() {
  let views = [];
  await until(async () => {
    views = await app.evaluate(({ webContents }) =>
      webContents
        .getAllWebContents()
        .filter((w) => w.getURL().startsWith('amble-extension:'))
        .map((w) => ({ id: w.id, url: w.getURL() })),
    );
    return views.length > 0;
  }, 'extension webview');
  return views[views.length - 1];
}
async function home(slug) {
  const title = catalog.find((c) => c.id === slug).title.zh;
  const button = page.locator('.sidebar').getByRole('button', { name: title, exact: true });
  if (!(await button.isVisible()))
    await page.locator('.sidebar').getByRole('button', { name: '扩展', exact: true }).click();
  await button.click();
  const v = await viewFor();
  await until(() => viewCode(v.id, 'document.readyState==="complete"'), 'home ready');
  return v;
}
async function captureView(slug, name, v) {
  const image = await app.evaluate(
    async ({ webContents }, id) =>
      (await webContents.fromId(id).capturePage()).toPNG().toString('base64'),
    v.id,
  );
  await mkdir(path.join(root, slug, 'screenshots'), { recursive: true });
  await writeFile(
    path.join(root, slug, 'screenshots', name + '.png'),
    Buffer.from(image, 'base64'),
  );
}
async function configure(slug, value) {
  const id = 'samples.' + slug,
    c = await page.evaluate((id) => window.desktop.extensions.configuration({ id }), id);
  await page.evaluate(
    ({ id, c, value }) =>
      window.desktop.extensions.configuration({
        id,
        action: 'save',
        value,
        generation: c.generation,
        expectedRevision: c.revision,
      }),
    { id, c, value },
  );
}
const flows = (runId) => page.evaluate((runId) => window.desktop.forms.list({ runId }), runId);
const flow = async (runId) => (await flows(runId))[0];
async function newFlow(slug, title, template = 'travel') {
  toolQueue = [
    { name: 'forms_list', args: {} },
    { name: 'forms_present', args: { key: 'extension:samples.' + slug + ':' + template } },
  ];
  const run = await page.evaluate(
    ({ providerId, title }) =>
      window.desktop.startRun({ prompt: title, providerId, permission: 'default' }),
    { providerId: provider.id, title },
  );
  await until(async () => !!(await flows(run.id)).length, 'form created');
  await until(
    async () =>
      (await page.evaluate(() => window.desktop.listRuns())).find((r) => r.id === run.id)
        ?.status === 'completed',
    'model complete',
  );
  await page
    .locator('.sidebar')
    .getByRole('button', { name: new RegExp(title) })
    .first()
    .click();
  return run.id;
}
async function fillClaim(slug, { drop = false } = {}) {
  const title = drop ? '断线恢复演示' : '上海客户拜访报销';
  const run = await newFlow(slug, title);
  const card = page.locator('[aria-label="财务报销助手"]:visible');
  await expect(card).toBeVisible();
  await card.getByLabel('出差地区').selectOption('shanghai');
  await card.getByLabel('出差日期').fill('2026-10-08');
  await until(
    async () => (await flow(run)).drafts.itinerary?.date === '2026-10-08',
    'draft autosave',
  );
  await shot(slug, '02-itinerary');
  await card.getByRole('button', { name: '保存行程并继续', exact: true }).click();
  await page.getByRole('button', { name: '确认执行', exact: true }).click();
  await until(async () => (await flow(run)).step === 1, 'itinerary saved');
  await card.getByLabel('金额').fill('1280.00');
  await card.getByLabel('说明').fill('上海客户拜访：高铁往返 680 元，酒店 600 元。');
  await until(
    async () => (await flow(run)).drafts.expenses?.remark?.includes('600'),
    'expense autosave',
  );
  await shot(slug, '03-expenses');
  await card.getByRole('button', { name: '下一步', exact: true }).click();
  await card.getByRole('checkbox', { name: /我已核对报销信息/ }).check();
  await shot(slug, '04-confirmation');
  const before = await (await fetch(`http://127.0.0.1:${port}/ledger`)).json();
  if (drop)
    await fetch(`http://127.0.0.1:${port}/control`, {
      method: 'POST',
      body: JSON.stringify({ operation: 'submitExpense', mode: 'drop' }),
    });
  await card.getByRole('button', { name: '提交报销', exact: true }).click();
  await page.getByRole('button', { name: '确认执行', exact: true }).click();
  if (drop) {
    await until(async () => (await flow(run)).status === 'unknown', 'unknown result');
    await shot(slug, '05-unknown');
    await card.getByRole('button', { name: '核实提交结果', exact: true }).click();
  }
  await until(async () => (await flow(run)).status === 'completed', 'claim complete');
  await shot(slug, drop ? '06-recovered' : '05-completed');
  const after = await (await fetch(`http://127.0.0.1:${port}/ledger`)).json();
  assert.equal(after.counts.expenses, before.counts.expenses + 1);
  const f = await flow(run);
  record(slug, drop ? 'drop-response-recovery' : 'three-step-claim', {
    countDelta: 1,
    status: f.status,
    amount: f.values.expenses.amount,
    results: f.results,
  });
  if (drop)
    await fetch(`http://127.0.0.1:${port}/control`, {
      method: 'POST',
      body: JSON.stringify({ operation: 'submitExpense', mode: 'normal' }),
    });
}
try {
  for (const f of ['core/forms/service.cjs', 'core/extensions/bootstrap.cjs', 'dist/index.html'])
    report.hashes[f] = createHash('sha256')
      .update(await readFile(path.join(host, f)))
      .digest('hex');
  service = createService({ database: path.join(temp, 'ledger.sqlite'), port: 0 });
  port = await service.listen();
  modelServer = http.createServer(async (req, res) => {
    try {
      for await (const _ of req) {
      }
      const tool = toolQueue.shift();
      round++;
      const item = tool
        ? {
            type: 'function_call',
            id: 'fc' + round,
            call_id: 'sample-' + round,
            namespace: 'mcp__amble_extensions',
            name: tool.name,
            arguments: JSON.stringify(tool.args),
            status: 'completed',
          }
        : {
            type: 'message',
            id: 'm' + round,
            role: 'assistant',
            status: 'completed',
            content: [
              {
                type: 'output_text',
                text: '请填写表单并核对信息。此演示仅使用虚构数据，不提交到真实财务系统。',
                annotations: [],
              },
            ],
          };
      const response = {
        id: 'r' + round,
        object: 'response',
        status: 'completed',
        output: [item],
        usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
      };
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      let seq = 0;
      for (const [type, data] of [
        ['response.created', { response: { ...response, status: 'in_progress', output: [] } }],
        ['response.output_item.added', { output_index: 0, item }],
        ['response.output_item.done', { output_index: 0, item }],
        ['response.completed', { response }],
      ])
        res.write(
          `event: ${type}\ndata: ${JSON.stringify({ type, sequence_number: seq++, ...data })}\n\n`,
        );
      res.end();
    } catch {
      res.writeHead(500);
      res.end();
    }
  });
  await new Promise((resolve, reject) => {
    modelServer.once('error', reject);
    modelServer.listen(0, '127.0.0.1', resolve);
  });
  app = await electron.launch({
    cwd: host,
    args: ['.', `--user-data-dir=${temp}/profile`],
    env: { ...process.env, ATELIER_DEV: '0' },
  });
  page = await app.firstWindow();
  page.setDefaultTimeout(15000);
  await page.getByRole('textbox', { name: '任务内容' }).waitFor();
  await app.evaluate(({ BrowserWindow, dialog }) => {
    BrowserWindow.getAllWindows()[0].setSize(1440, 1100);
    dialog.showMessageBox = async () => ({ response: 1 });
  });
  await page.evaluate(
    (directory) =>
      window.desktop.patchWorkspace({
        changes: [
          {
            kind: 'project',
            action: 'put',
            id: 'sample-project',
            expectedRevision: null,
            value: {
              id: 'sample-project',
              name: '客户服务演示',
              path: directory,
              description: '使用虚构数据演示项目、任务与聊天关联。',
              createdAt: '2026-10-08T00:00:00Z',
            },
          },
        ],
      }),
    temp,
  );
  provider = await page.evaluate(
    (baseUrl) =>
      window.desktop.saveProvider({
        name: 'Samples local fixture',
        baseUrl,
        model: 'fixture',
        protocol: 'responses',
        executable: '',
      }),
    `http://127.0.0.1:${modelServer.address().port}/v1`,
  );
  for (const s of catalog.filter((c) => c.status !== 'planned')) {
    const archive = path.join(root, s.id, 'dist', s.id + '.amble-extension');
    report.hashes[s.id] = createHash('sha256')
      .update(await readFile(archive))
      .digest('hex');
    await app.evaluate(({ dialog }, archive) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [archive] });
    }, archive);
    await page.evaluate(() => window.desktop.extensions.install({}));
    if (s.permissions.length)
      await page.evaluate(
        (id) => window.desktop.extensions.grants({ id, projectId: 'sample-project' }),
        'samples.' + s.id,
      );
    record(s.id, 'archive-install', { id: 'samples.' + s.id });
  }
  await configure('expense-workflow', { serviceUrl: `http://127.0.0.1:${port}` });
  await configure('submission-recovery', { serviceUrl: `http://127.0.0.1:${port}` });
  await configure('configuration', { limit: 20, note: '演示配置已保存' });
  if (appearance) {
    await home('theme-and-i18n');
    await page.getByRole('button', { name: '设置', exact: true }).click();
    await page.getByRole('button', { name: '深色', exact: true }).click();
    await page.locator('.settings-return button').click();
    let v = await viewFor();
    await until(
      () => viewCode(v.id, 'document.documentElement.dataset.theme==="dark"'),
      'dark host context',
    );
    await captureView('theme-and-i18n', '02-dark', v);
    await page.getByRole('button', { name: '设置', exact: true }).click();
    await page.getByLabel('界面语言', { exact: true }).selectOption('en');
    await until(() => page.locator('.settings-return button').isEnabled(), 'language save');
    await page.locator('.settings-return button').click();
    v = await viewFor();
    await until(
      () => viewCode(v.id, 'document.documentElement.lang==="en"'),
      'English host context',
    );
    await captureView('theme-and-i18n', '03-english-dark', v);
    record('theme-and-i18n', 'host-dark-and-English', {});
    const iconEntry = page
      .locator('.sidebar')
      .getByRole('button', { name: 'Extension icons', exact: true });
    await iconEntry.click();
    await expect(iconEntry.locator('.extension-icon-dark img')).toBeVisible();
    assert.equal(
      await iconEntry.locator('.extension-icon-dark img').evaluate((i) => i.naturalWidth),
      128,
    );
    await shot('extension-icons', '02-host-dark');
    record('extension-icons', 'dark-packaged-icon', { size: 128 });
    v = await home('expense-workflow');
    const initialLanguage = await viewCode(v.id, 'document.documentElement.lang');
    if (initialLanguage !== 'en') {
      report.results.push({
        sample: 'expense-workflow',
        check: 'new-page-initial-locale',
        status: 'blocked',
        evidence: {
          expected: 'en',
          actual: initialLanguage,
          reason: 'Host page open does not seed locale from owner context.',
        },
      });
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page.getByLabel('Interface language', { exact: true }).selectOption('zh-CN');
      await page.locator('.settings-return button').click();
      await page.getByRole('button', { name: '设置', exact: true }).click();
      await page.getByLabel('界面语言', { exact: true }).selectOption('en');
      await page.locator('.settings-return button').click();
    }
    await until(
      () => viewCode(v.id, 'document.documentElement.lang==="en"'),
      'English flagship after context change',
    );
    await captureView('expense-workflow', '07-english-dark', v);
    record('expense-workflow', 'English-dark-home', {});
  } else if (!advanced) {
    for (const s of catalog.filter((c) => c.status !== 'planned' && c.id !== 'mcp-apps-card')) {
      const v = await home(s.id);
      await new Promise((r) => setTimeout(r, 350));
      const clicks = {
        'hello-operation': 'count',
        'npm-data-transform': 'parse',
        configuration: 'read',
        'secret-input': 'exists',
        'enterprise-auth': 'status',
        'storage-notebook': 'read',
        'operation-confirmation': 'read',
        'service-events': 'status',
        'message-actions': 'actionRecords',
      };
      if (clicks[s.id]) {
        await viewCode(
          v.id,
          `document.querySelector('[data-operation="${clicks[s.id]}"]').click()`,
        );
        await until(
          () => viewCode(v.id, '!document.querySelector("[data-operation]").disabled'),
          'operation complete',
        );
      }
      if (s.id === 'project-card') {
        await viewCode(v.id, 'document.querySelector("[data-operation=describe]").click()');
        await page.getByLabel('选择授权项目', { exact: true }).waitFor();
        await page.getByLabel('选择授权项目', { exact: true }).selectOption('sample-project');
        await page.getByRole('button', { name: '确认授权', exact: true }).click();
        await until(
          () =>
            viewCode(
              v.id,
              'document.querySelector("#result").textContent.includes("客户服务演示")',
            ),
          'project details',
        );
      }
      if (['expense-workflow', 'submission-recovery'].includes(s.id)) {
        await viewCode(v.id, 'document.querySelector("#check").click()');
        await until(
          () => viewCode(v.id, 'document.querySelector("#status").textContent.includes("已连接")'),
          'expense health',
        );
      }
      await captureView(s.id, '01-home', v);
      record(s.id, 'home-render', {
        urlScheme: 'amble-extension',
        screenshot: s.id + '/screenshots/01-home.png',
      });
    }
    await fillClaim('expense-workflow');
    await fillClaim('submission-recovery', { drop: true });
    const v = await home('expense-workflow');
    await viewCode(v.id, 'document.querySelector("#refresh").click()');
    await until(() => viewCode(v.id, '!!document.querySelector("tbody tr")'), 'records');
    await captureView('expense-workflow', '06-records', v);
    record('expense-workflow', 'records-query', {
      rows: await viewCode(v.id, 'document.querySelectorAll("tbody tr").length'),
    });
    await newFlow('declarative-intake', '团队活动计划', 'team-intake');
    await shot('declarative-intake', '02-form');
    record('declarative-intake', 'form-present', { template: 'team-intake' });
    toolQueue = [
      {
        name: 'extension_invoke_operation',
        args: {
          operationId: 'samples.mcp-apps-card.render',
          input: { destination: '上海', amount: 1200 },
        },
      },
    ];
    const task = await page.evaluate(
      (providerId) =>
        window.desktop.startRun({ prompt: '差旅交互卡片演示', providerId, permission: 'default' }),
      provider.id,
    );
    await until(
      async () =>
        (await page.evaluate(() => window.desktop.listRuns())).find((r) => r.id === task.id)
          ?.status === 'completed',
      'MCP model complete',
    );
    await page
      .locator('.sidebar')
      .getByRole('button', { name: /差旅交互卡片演示/ })
      .first()
      .click();
    await page.getByRole('button', { name: '打开交互内容', exact: true }).click();
    const frame = page.frameLocator('.task-app-card iframe');
    await expect(frame.locator('#destination')).toHaveValue('上海');
    await shot('mcp-apps-card', '01-card');
    await frame.locator('#destination').fill('杭州');
    await frame.locator('#save').click();
    await page.getByRole('button', { name: '确认执行', exact: true }).click();
    await expect(frame.locator('#status')).toHaveText('已保存到本地记录。');
    await shot('mcp-apps-card', '02-saved');
    record('mcp-apps-card', 'render-edit-confirm-save', { destination: '杭州' });
  } else {
    async function click(v, operation, { confirm = false } = {}) {
      await viewCode(v.id, `document.querySelector('[data-operation="${operation}"]').click()`);
      if (confirm) await page.getByRole('button', { name: '确认执行', exact: true }).click();
      await until(
        () => viewCode(v.id, '!document.querySelector("[data-operation]").disabled'),
        'action complete',
      );
      const status = await viewCode(v.id, 'document.querySelector("#status").textContent');
      assert.ok(!/FORBIDDEN|INVALID_|INTERNAL|结果待核实/.test(status), status);
      return JSON.parse(await viewCode(v.id, 'document.querySelector("#result").textContent'));
    }
    let v = await home('storage-notebook');
    await click(v, 'read');
    const saved = await click(v, 'save', { confirm: true });
    assert.equal(saved.value, '周五前完成客户回访。');
    await captureView('storage-notebook', '02-saved', v);
    record('storage-notebook', 'read-cas-save', { revision: saved.revision });
    v = await home('operation-confirmation');
    await click(v, 'save', { confirm: true });
    assert.ok((await click(v, 'read')).record);
    await click(v, 'remove', { confirm: true });
    assert.equal((await click(v, 'read')).record, null);
    await captureView('operation-confirmation', '02-deleted', v);
    record('operation-confirmation', 'confirm-create-read-delete', {});
    v = await home('contextual-entry');
    await viewCode(v.id, 'document.querySelector("[data-operation=link]").click()');
    await page.getByRole('button', { name: '确认执行', exact: true }).click();
    await until(
      () => viewCode(v.id, 'document.querySelector("#result").textContent.includes("true")'),
      'context set',
    );
    await captureView('contextual-entry', '02-linked', v);
    record('contextual-entry', 'context-key-set', {});
    v = await home('conversation-launcher');
    await viewCode(v.id, 'document.querySelector("[data-operation=create]").click()');
    await page.getByLabel('选择授权项目', { exact: true }).selectOption('sample-project');
    await page.getByRole('button', { name: '确认授权', exact: true }).click();
    await page.getByRole('button', { name: '确认执行', exact: true }).click();
    await until(
      () => viewCode(v.id, '!document.querySelector("[data-operation]").disabled'),
      'draft created',
    );
    const created = JSON.parse(
      await viewCode(v.id, 'document.querySelector("#result").textContent'),
    );
    assert.equal(created.state, 'draft');
    await captureView('conversation-launcher', '02-draft', v);
    await viewCode(
      v.id,
      `document.querySelector('#conversationId').value=${JSON.stringify(created.id)}`,
    );
    await viewCode(v.id, 'document.querySelector("[data-operation=open]").click()');
    await until(
      async () => !(await app.evaluate(({ webContents }, id) => !!webContents.fromId(id), v.id)),
      'opened existing draft',
    );
    record('conversation-launcher', 'create-and-open-existing', { state: created.state });
    v = await home('cancellation-and-errors');
    await viewCode(v.id, 'document.querySelector("[data-operation=slow]").click()');
    await viewCode(v.id, 'document.querySelector("#cancel").click()');
    await until(
      () => viewCode(v.id, '!document.querySelector("[data-operation]").disabled'),
      'cancelled',
    );
    await captureView('cancellation-and-errors', '02-cancelled', v);
    record('cancellation-and-errors', 'cancel-read-wait', {});
    v = await home('local-messages');
    assert.equal((await click(v, 'publish', { confirm: true })).status, 'published');
    assert.equal((await click(v, 'publish', { confirm: true })).status, 'duplicate');
    await click(v, 'query');
    await captureView('local-messages', '02-message', v);
    await click(v, 'update', { confirm: true });
    await click(v, 'withdraw', { confirm: true });
    record('local-messages', 'publish-duplicate-query-update-withdraw', {});
    // Message action service uses persistent SQLite and explicit result reports.
    actionService = own('../message-actions/action-service/server.cjs').createService({
      database: path.join(temp, 'actions.sqlite'),
      port: 0,
    });
    const actionPort = await actionService.listen();
    await configure('message-actions', { actionServiceUrl: `http://127.0.0.1:${actionPort}` });
    v = await home('message-actions');
    await viewCode(v.id, 'document.querySelector("#mode").value="unknown"');
    assert.equal((await click(v, 'actionPublish', { confirm: true })).status, 'published');
    await page.getByRole('button', { name: /消息中心/ }).click();
    await page.locator('.message-open').filter({ hasText: '团队任务待处理' }).click();
    await page.getByRole('button', { name: '提交任务 / Submit', exact: true }).click();
    await page.getByRole('button', { name: '确认执行', exact: true }).click();
    await until(async () => {
      const rows = (await page.evaluate(() => window.desktop.messages.list())).items;
      return rows.some((m) => m.executions?.some((e) => e.state === 'unknown'));
    }, 'unknown message action');
    await shot('message-actions', '02-unknown');
    v = await home('message-actions');
    const records = await click(v, 'actionRecords');
    const invocation = records.find((r) => r.state === 'unknown');
    assert.ok(invocation);
    await viewCode(
      v.id,
      `document.querySelector('#invocationId').value=${JSON.stringify(invocation.id)}`,
    );
    const reconciled = await click(v, 'actionReconcile', { confirm: true });
    assert.equal(reconciled.invocation.state, 'completed');
    assert.equal(reconciled.message.businessState, 'resolved');
    const ledger = await (await fetch(`http://127.0.0.1:${actionPort}/ledger`)).json();
    assert.equal(ledger.writes, 1);
    await captureView('message-actions', '03-reconciled', v);
    record('message-actions', 'unknown-read-reconcile', {
      writes: ledger.writes,
      state: 'completed',
    });
    pushService = own('../service-events/service/server.cjs').createService();
    await new Promise((resolve, reject) => {
      pushService.server.once('error', reject);
      pushService.server.listen(0, '127.0.0.1', resolve);
    });
    const pushPort = pushService.server.address().port;
    await configure('service-events', { serviceUrl: `http://127.0.0.1:${pushPort}/events` });
    v = await home('service-events');
    await click(v, 'connect', { confirm: true });
    await until(
      async () =>
        (await (await fetch(`http://127.0.0.1:${pushPort}/stats`)).json()).connections === 1,
      'single SSE connection',
    );
    const event = {
      eventId: 'qa-progress',
      taskId: 'customer-visit',
      kind: 'progress',
      version: 2,
      title: '客户回访进展',
      body: '计划已核对，可以安排回访。',
    };
    const send = (e) =>
      fetch(`http://127.0.0.1:${pushPort}/event`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(e),
      });
    await send(event);
    await send({ ...event, version: 1, body: '旧版本不应覆盖' });
    await send(event);
    await until(
      async () =>
        (await page.evaluate(() => window.desktop.messages.list())).items.some(
          (m) => m.title === event.title,
        ),
      'push received',
    );
    await click(v, 'status');
    await captureView('service-events', '02-connected', v);
    const messages = (await page.evaluate(() => window.desktop.messages.list())).items.filter(
      (m) => m.title === event.title,
    );
    assert.equal(messages.length, 1);
    assert.equal(messages[0].body, event.body);
    await click(v, 'disconnect', { confirm: true });
    await until(
      async () =>
        (await (await fetch(`http://127.0.0.1:${pushPort}/stats`)).json()).connections === 0,
      'SSE closed',
    );
    record('service-events', 'push-dedup-order-disconnect', { messages: 1 });
    // Flagship owns its own response-loss evidence, not a screenshot borrowed from another sample.
    await fillClaim('expense-workflow', { drop: true });
  }
  report.results.push({
    sample: 'enterprise-auth',
    check: 'production-idp',
    status: 'not-run',
    evidence: 'No enterprise IdP configured; only unconnected status UI tested.',
  });
} catch (e) {
  report.error = { message: e.message, stack: e.stack };
  console.error(e);
  if (app)
    try {
      report.nativeViews = await app.evaluate(({ webContents }) =>
        Promise.all(
          webContents
            .getAllWebContents()
            .filter((w) => w.getURL().startsWith('amble-extension:'))
            .map(async (w) => ({
              url: w.getURL(),
              text: await w.executeJavaScript('document.body.innerText'),
            })),
        ),
      );
    } catch {}
  if (page)
    try {
      await mkdir(path.join(root, 'test-results'), { recursive: true });
      await page.screenshot({ path: path.join(root, 'test-results/failure.png') });
      await writeFile(
        path.join(root, 'test-results/failure.txt'),
        await page.locator('body').innerText(),
      );
    } catch {}
  process.exitCode = 1;
} finally {
  await mkdir(path.join(root, 'docs/evidence'), { recursive: true });
  await writeFile(
    path.join(
      root,
      'docs/evidence',
      appearance ? 'desktop-appearance.json' : advanced ? 'desktop-advanced.json' : 'desktop.json',
    ),
    JSON.stringify(report, null, 2),
  );
  await app?.close();
  await actionService?.close();
  await pushService?.close();
  await service?.close();
  if (modelServer) {
    modelServer.closeAllConnections();
    await new Promise((r) => modelServer.close(r));
  }
  await rm(temp, { recursive: true, force: true });
}
