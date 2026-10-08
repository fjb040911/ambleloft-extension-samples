import type { ExtensionContext } from '@ambleloft/extension-sdk';
import { getMessages } from '@ambleloft/extension-sdk/messages-preview';
import { PushConnection } from './push';
export function activate(context: ExtensionContext) {
  const push = new PushConnection(async (e, current) => {
    const key = 'event:' + e.eventId,
      prior = await context.storage.get(key);
    if (prior && Number((prior.value as any).version) >= e.version) return;
    const revision = await context.storage.set(
      key,
      { version: e.version, state: 'pending' },
      prior?.revision ?? null,
    );
    if (!current()) return;
    const api = getMessages(context),
      message = await api.getByEventKey(e.eventId);
    if (!current()) return;
    if (e.kind === 'withdraw') {
      if (message) await api.withdraw(message.id, message.revision);
    } else if (message)
      await api.update(message.id, { title: e.title, body: e.body }, message.revision);
    else
      await api.publish({
        eventKey: e.eventId,
        title: e.title,
        body: e.body,
        category: 'notice',
        actions: [],
      });
    if (current())
      await context.storage.set(key, { version: e.version, state: 'processed' }, revision);
  });
  context.subscriptions.push(push);
  context.subscriptions.push(
    context.operations.register('connect', async () => {
      const c = await context.configuration.get();
      push.configure(String(c.serviceUrl || 'http://127.0.0.1:47831/events'), true);
      return push.snapshot();
    }),
  );
  context.subscriptions.push(
    context.operations.register('disconnect', async () => {
      push.dispose();
      return push.snapshot();
    }),
  );
  context.subscriptions.push(context.operations.register('status', async () => push.snapshot()));
}
