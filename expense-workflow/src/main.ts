import {
  defineExtension,
  type ExtensionContext,
  type InvocationContext,
  type JsonObject,
  type FormRecoveryResult,
} from '@ambleloft/extension-sdk';
function requireForm(call: InvocationContext) {
  if (!call.form?.submissionId)
    throw Object.assign(new Error('This operation requires host form context'), {
      code: 'UNSUPPORTED',
    });
  return call.form;
}
export const { activate } = defineExtension({
  activate(context: ExtensionContext) {
    async function request(endpoint: string, body: JsonObject, signal: AbortSignal) {
      const config = await context.configuration.get();
      const url = new URL(String(config.serviceUrl || ''));
      if (
        url.protocol !== 'http:' ||
        url.hostname !== '127.0.0.1' ||
        url.username ||
        url.password ||
        url.pathname !== '/' ||
        url.search ||
        url.hash
      )
        throw Object.assign(new Error('Configure a loopback serviceUrl'), {
          code: 'INVALID_ARGUMENT',
        });
      const response = await fetch(new URL(endpoint, url), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
      if (response.status !== 200)
        throw Object.assign(new Error('Business result requires verification'), {
          code: 'OUTCOME_UNKNOWN',
        });
      return (await response.json()) as JsonObject;
    }
    for (const operation of ['status', 'records'])
      context.subscriptions.push(
        context.operations.register(operation, async (_, call) => {
          const config = await context.configuration.get();
          const url = new URL(String(config.serviceUrl || ''));
          if (
            url.protocol !== 'http:' ||
            url.hostname !== '127.0.0.1' ||
            url.username ||
            url.password ||
            url.pathname !== '/' ||
            url.search ||
            url.hash
          )
            throw Object.assign(Error('请在扩展设置配置本机 serviceUrl'), {
              code: 'INVALID_ARGUMENT',
            });
          const response = await fetch(
            new URL(operation === 'status' ? '/health' : '/expenses', url),
            { signal: AbortSignal.any([call.signal, AbortSignal.timeout(5000)]) },
          );
          if (!response.ok) throw Error('演示服务不可用');
          return (await response.json()) as JsonObject;
        }),
      );
    for (const operation of ['saveDraft', 'submitExpense']) {
      context.subscriptions.push(
        context.operations.register(operation, async (input, call) => {
          const form = requireForm(call); // Never accept input.form or substitute requestId.
          return request(
            '/write',
            {
              operation,
              submissionId: form.submissionId,
              input,
              trace: { ...form, requestId: call.requestId, caller: call.caller },
            },
            call.signal,
          );
        }),
      );
      context.subscriptions.push(
        context.operations.register(
          operation === 'saveDraft' ? 'lookupDraft' : 'lookupExpense',
          async (input, call) => {
            // Recovery deliberately does not read call.form.
            const result = (await request(
              '/lookup',
              { operation, submissionId: input.submissionId },
              call.signal,
            )) as FormRecoveryResult;
            if (!['succeeded', 'notExecuted', 'unknown'].includes(result.status))
              throw new Error('Invalid recovery result');
            return result;
          },
        ),
      );
    }
  },
});
