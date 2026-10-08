import type { ExtensionContext, JsonObject, InvocationContext } from '@ambleloft/extension-sdk';
import { getMessages } from '@ambleloft/extension-sdk/messages-preview';
const failure = (code: string) => Object.assign(new Error(code), { code });
export function activate(context: ExtensionContext) {
  const messages = getMessages(context);
  let changes = 0;

  const register = (
    name: string,
    fn: (input: JsonObject, inv: InvocationContext) => Promise<unknown>,
  ) =>
    context.subscriptions.push(
      context.operations.register(name, async (input, inv) => ({
        data: JSON.stringify(await fn(input, inv)),
      })),
    );
  const auth = () => {
    if (!context.authentication) throw failure('UNSUPPORTED');
    return context.authentication;
  };
  const service = async (path: string, body?: unknown) => {
    const config = await context.configuration.get();
    let url: URL;
    try {
      url = new URL(String(config.actionServiceUrl));
    } catch {
      throw failure('INVALID_ARGUMENT');
    }
    // This demonstration only talks to its separately started local business service.
    if (
      url.protocol !== 'http:' ||
      url.hostname !== '127.0.0.1' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/'
    )
      throw failure('INVALID_ARGUMENT');
    const response = await fetch(new URL(path, url), {
      method: body === undefined ? 'GET' : 'POST',
      ...(body === undefined
        ? {}
        : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw failure('HOST_UNAVAILABLE');
    return response.json() as Promise<{ id: string; state: 'accepted' | 'completed' | 'unknown' }>;
  };
  register('actionPublish', async (input) =>
    messages.publish({
      eventKey: String(input.eventKey),
      title: '团队任务待处理 / Team task',
      body: '在消息中心确认后提交本机业务服务；未知结果仅查询，不重放。',
      category: 'actionRequired',
      actions: [
        {
          id: 'submit',
          label: '提交任务 / Submit',
          commandId: context.extensionId + '.actionRun',
          arguments: { eventKey: input.eventKey, mode: input.mode },
        },
      ],
    }),
  );
  register('actionRecords', async () => messages.listActionInvocations());
  register('actionRun', async (input, inv) => {
    if (!inv.message) throw failure('FORBIDDEN');
    const record = (await messages.listActionInvocations()).find(
      (r) => r.id === inv.message!.invocationId,
    );
    if (!record) throw failure('NOT_FOUND');
    let remote;
    try {
      remote = await service('/tasks', { id: record.id, mode: input.mode });
    } catch {
      return messages.reportActionResult({
        invocationId: record.id,
        reportId: 'initial-unknown',
        expectedRevision: record.revision,
        outcome: 'unknown',
      });
    }
    return messages.reportActionResult({
      invocationId: record.id,
      reportId: 'initial-accepted',
      expectedRevision: record.revision,
      outcome: 'accepted',
      remoteTaskId: remote.id,
    });
  });
  register('actionReconcile', async (input) => {
    const record = (await messages.listActionInvocations()).find(
      (r) => r.id === input.invocationId,
    );
    if (!record) throw failure('NOT_FOUND');
    const message = await messages.getByEventKey(String(input.eventKey));
    if (!message || message.id !== record.messageId) throw failure('FORBIDDEN');
    const remote = await service('/tasks/' + encodeURIComponent(record.id));
    // A missing service record is unknown, never evidence permitting replay.
    if (remote.state === 'unknown') return { state: 'unknown', reported: false };
    return messages.reportActionResult({
      invocationId: record.id,
      reportId: 'query-' + remote.state,
      expectedRevision: record.revision,
      outcome: remote.state,
      remoteTaskId: record.id,
      ...(remote.state === 'completed'
        ? {
            messageUpdate: {
              patch: { businessState: 'resolved' as const },
              expectedRevision: message.revision,
            },
          }
        : {}),
    });
  });
}
