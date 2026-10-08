import {
  defineExtension,
  type JsonObject,
  type InvocationContext,
  type Json,
} from '@ambleloft/extension-sdk';
import { getMessages } from '@ambleloft/extension-sdk/messages-preview';
import { getResources, observeConfiguration } from '@ambleloft/extension-sdk/runtime-preview';
import { decodeConfig, defaults } from './config';
import { PushConnection } from './push';
type Chat = { id: string; title: string };
type Task = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  chats: Chat[];
  pending: boolean;
};
const fail = (code: string) => Object.assign(new Error(code), { code });
export const { activate } = defineExtension({
  activate(context) {
    const bootId = crypto.randomUUID();
    let config = { ...defaults },
      configCode = '',
      changes = 0,
      configSubscription: ReturnType<typeof observeConfiguration> | undefined,
      manual = false,
      disposed = false;
    let writeBusy = false,
      probeChanges = 0;
    let probe: { dispose(): void } | undefined;
    context.subscriptions.push({
      dispose() {
        probe?.dispose();
      },
    });
    let messages: ReturnType<typeof getMessages> | undefined;
    try {
      messages = getMessages(context);
    } catch {}
    const api = () => {
      if (!messages) throw fail('UNSUPPORTED');
      return messages;
    };
    const read = async () => {
      const entry = await context.storage.get('tasks-v1');
      return { entry, tasks: (entry?.value || []) as unknown as Task[] };
    };
    const save = async (state: Awaited<ReturnType<typeof read>>) =>
      context.storage.set(
        'tasks-v1',
        state.tasks as unknown as Json,
        state.entry?.revision ?? null,
      );
    const find = async (input: JsonObject, inv: InvocationContext) => {
      await getResources(inv).getProject(String(input.projectId));
      const state = await read();
      const task = state.tasks.find(
        (t) => t.id === input.taskId && t.projectId === input.projectId,
      );
      if (!task) throw fail('NOT_FOUND');
      return { state, task };
    };
    const push = new PushConnection(async (e, current) => {
      // Persist the highest observed version BEFORE side effects. A crash leaves an explicit uncertain intent, not a replay.
      const key = 'push:' + e.eventId,
        prior = await context.storage.get(key),
        old = prior?.value as JsonObject | undefined;
      if (old && Number(old.version) >= e.version) return;
      if (!current()) return;
      const rev = await context.storage.set(
        key,
        { version: e.version, outcome: 'pending', taskId: e.taskId },
        prior?.revision ?? null,
      );
      if (!current()) return;
      const eventKey = 'business:' + e.eventId;
      const existing = await api().getByEventKey(eventKey);
      if (!current()) return;
      let result: unknown;
      if (e.kind === 'withdraw')
        result = existing ? await api().withdraw(existing.id, existing.revision) : null;
      else if (existing)
        result = await api().update(
          existing.id,
          { title: e.title, body: e.body },
          existing.revision,
        );
      else
        result = await api().publish({
          eventKey,
          title: e.title,
          body: e.body,
          category: 'notice',
          actions: [],
        });
      if (current())
        await context.storage.set(
          key,
          { version: e.version, outcome: 'processed', taskId: e.taskId },
          rev,
        );
      void result;
    });
    const apply = (value: ReturnType<typeof decodeConfig>) => {
      const connectionChanged =
        config.serviceUrl !== value.serviceUrl || config.connected !== value.connected;
      config = value;
      changes++;
      if (connectionChanged) manual = false;
      if (!manual) push.configure(config.serviceUrl, config.connected);
    };
    const ensureConfig = async () => {
      if (configSubscription) return;
      const sub = observeConfiguration(context, decodeConfig, apply);
      configSubscription = sub;
      try {
        await sub.ready;
        configCode = '';
      } catch (e) {
        configSubscription = undefined;
        configCode = (e as { code?: string }).code || 'UNSTRUCTURED_HOST_ERROR';
      }
    };
    context.subscriptions.push({
      dispose() {
        disposed = true;
        configSubscription?.dispose();
        push.dispose();
      },
    });
    const register = (
      name: string,
      write: boolean,
      handler: (input: JsonObject, inv: InvocationContext) => Promise<unknown>,
    ) =>
      context.subscriptions.push(
        context.operations.register(name, async (input, inv) => {
          if (disposed) return { success: false, code: 'DISABLED', data: '' };
          if (write && writeBusy) return { success: false, code: 'BUSY', data: '' };
          if (write) writeBusy = true;
          try {
            return { success: true, code: '', data: JSON.stringify(await handler(input, inv)) };
          } catch (error) {
            return {
              success: false,
              code: (error as { code?: string }).code || 'UNSTRUCTURED_HOST_ERROR',
              data: '',
            };
          } finally {
            if (write) writeBusy = false;
          }
        }),
      );
    register('status', false, async () => {
      await ensureConfig();
      let tasks: Task[] = [],
        storageCode = '';
      try {
        tasks = (await read()).tasks;
      } catch (e) {
        storageCode = (e as { code?: string }).code || 'UNSTRUCTURED_HOST_ERROR';
      }
      await context.context.set(`ext.${context.extensionId}.linked`, tasks.length > 0);
      return {
        bootId,
        packageRevision: context.packageRevision,
        version: '0.2.0',
        tasks,
        config,
        configCode,
        storageCode,
        changes,
        connection: push.snapshot(),
        messagesAvailable: !!messages,
        nodeTranslation: context.l10n.t('name'),
      };
    });
    register('addTask', true, async (input, inv) => {
      const project = await getResources(inv).getProject(String(input.projectId));
      const state = await read();
      if (state.tasks.length >= config.limit) throw fail('BUSY');
      const task: Task = {
        id: crypto.randomUUID(),
        title: String(input.title),
        projectId: project.id,
        projectName: project.name,
        chats: [],
        pending: false,
      };
      state.tasks.push(task);
      await save(state);
      await context.context.set(`ext.${context.extensionId}.linked`, true);
      return task;
    });
    register('removeTask', true, async (input, inv) => {
      const { state, task } = await find(input, inv);
      state.tasks = state.tasks.filter((t) => t !== task);
      await save(state);
      await context.context.set(`ext.${context.extensionId}.linked`, state.tasks.length > 0);
      return { removed: true };
    });
    register('createChat', true, async (input, inv) => {
      const { state, task } = await find(input, inv);
      if (task.pending) throw fail('OUTCOME_UNKNOWN');
      if (task.chats.length >= config.limit) throw fail('BUSY');
      task.pending = true;
      const pendingRevision = await save(state);
      const ref = await getResources(inv).createConversation({
        projectId: task.projectId,
        title: String(input.title),
        initialPrompt: String(input.prompt || ''),
      });
      task.chats.push({ id: ref.id, title: String(input.title) });
      task.pending = false;
      await context.storage.set('tasks-v1', state.tasks as unknown as Json, pendingRevision);
      return ref;
    });
    register('acknowledgeUnknown', true, async (input, inv) => {
      const { state, task } = await find(input, inv);
      task.pending = false;
      await save(state);
      return { acknowledged: true };
    });
    register('openChat', false, async (input, inv) => {
      const { task } = await find(input, inv);
      if (!task.chats.some((c) => c.id === input.conversationId)) throw fail('NOT_FOUND');
      await getResources(inv).openConversation(String(input.conversationId));
      return { opened: true };
    });
    register('unlinkChat', true, async (input, inv) => {
      const { state, task } = await find(input, inv);
      task.chats = task.chats.filter((c) => c.id !== input.conversationId);
      await save(state);
      return { unlinked: true };
    });
    register('summary', false, async (input, inv) => {
      const { task } = await find(input, inv);
      return { title: task.title, conversations: task.chats.length };
    });
    register('projectPath', false, async (input, inv) => ({
      path: await getResources(inv).getProjectPath(String(input.projectId)),
    }));
    register('publish', true, async (input) =>
      api().publish({
        eventKey: String(input.eventKey),
        title: String(input.title),
        body: String(input.body),
        category: 'notice',
        actions: [],
      }),
    );
    register('query', false, async (input) => api().getByEventKey(String(input.eventKey)));
    register('update', true, async (input) =>
      api().update(String(input.id), { body: String(input.body) }, Number(input.revision)),
    );
    register('withdraw', true, async (input) =>
      api().withdraw(String(input.id), Number(input.revision)),
    );
    register('preferences', false, async () => api().getPreferences());
    register('connection', true, async (input) => {
      await ensureConfig();
      manual = !input.connected;
      push.configure(config.serviceUrl, !!input.connected);
      return push.snapshot();
    });
    register('secretStatus', false, async () => ({
      present: (await context.secrets.get('demo-test-key')) !== null,
    }));
    register('secretDelete', true, async () => {
      await context.secrets.delete('demo-test-key');
      return { deleted: true };
    });
    register('kvCheck', true, async () => {
      const key = 'test-null';
      const prior = await context.storage.get(key);
      if (prior) await context.storage.delete(key, prior.revision);
      const missing = await context.storage.get(key);
      const a = await context.storage.set(key, null, null);
      const stored = await context.storage.get(key);
      await context.storage.delete(key, a);
      const b = await context.storage.set(key, 'recreated', null);
      let code = '';
      try {
        await context.storage.set(key, 'stale', a);
      } catch (e) {
        code = (e as { code?: string }).code || 'UNSTRUCTURED_HOST_ERROR';
      }
      await context.storage.delete(key, b);
      return {
        missing: missing === null,
        nullValue: stored?.value === null,
        increasing: b > a,
        staleCode: code,
      };
    });
    register('rpcProbe', false, async () => {
      const results = await Promise.allSettled(
        Array.from({ length: 64 }, () => context.configuration.get()),
      );
      return {
        completed: results.filter((r) => r.status === 'fulfilled').length,
        structured: results.filter((r) => r.status === 'rejected' && r.reason?.code).length,
        unstructured: results.filter((r) => r.status === 'rejected' && !r.reason?.code).length,
      };
    });
    register(
      'crashProbe',
      true,
      async () => new Promise(() => setTimeout(() => process.exit(73), 100)),
    );
    register('listenerProbe', true, async (input) => {
      if (input.action === 'start') {
        probe?.dispose();
        probeChanges = 0;
        probe = context.configuration.onDidChange(() => probeChanges++);
      }
      if (input.action === 'dispose') {
        probe?.dispose();
        probe = undefined;
      }
      return { changes: probeChanges, active: !!probe };
    });
    register('messageProbe', true, async (input) => {
      const args = JSON.parse(String(input.payload));
      const method = String(input.method);
      if (method === 'publish') return api().publish(args);
      if (method === 'update') return api().update(args.id, args.patch, args.revision);
      throw fail('INVALID_ARGUMENT');
    });
    register('resourceProbe', false, async (input, inv) => {
      await getResources(inv).openConversation(String(input.conversationId || ''));
      return { opened: true };
    });
    register('delay', true, async (input, inv) => {
      await new Promise((resolve) => setTimeout(resolve, Number(input.ms)));
      if (inv.signal.aborted) throw fail('CANCELLED');
      return api().publish({
        eventKey: String(input.eventKey),
        title: 'Lifecycle check',
        body: '',
        category: 'notice',
      });
    });
    // Start only after all handlers are synchronously registered. No startup grant dialog.
    void ensureConfig();
  },
});
