import { defineExtension, type ExtensionContext } from '@ambleloft/extension-sdk';
import { activate as team } from './team';
import { activate as expense } from './expense';
import { activate as actionsAuth } from './actions-auth';
const excluded = new Set([
  'crashProbe',
  'rpcProbe',
  'messageProbe',
  'listenerProbe',
  'resourceProbe',
  'delay',
]);
export const { activate } = defineExtension({
  activate(context) {
    const teamContext: ExtensionContext = {
      ...context,
      operations: {
        register(name, handler) {
          return excluded.has(name) ? { dispose() {} } : context.operations.register(name, handler);
        },
      },
    };
    void team(teamContext);
    void expense(context);
    actionsAuth(context);
    context.subscriptions.push(context.operations.register('cardRender', async (input) => input));
    context.subscriptions.push(
      context.operations.register('cardSave', async (input) => {
        const old = await context.storage.get('card-travel');
        await context.storage.set('card-travel', input, old?.revision ?? null);
        return input;
      }),
    );
  },
});
