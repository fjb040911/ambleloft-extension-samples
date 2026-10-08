import type { JsonObject } from '@ambleloft/extension-sdk';
export const defaults = {
  serviceUrl: '',
  connected: false,
  density: 'comfortable' as 'comfortable' | 'compact',
  limit: 20,
  note: '',
};
export function decodeConfig(value: JsonObject): typeof defaults {
  return {
    serviceUrl: typeof value.serviceUrl === 'string' ? value.serviceUrl : defaults.serviceUrl,
    connected: typeof value.connected === 'boolean' ? value.connected : defaults.connected,
    density: value.density === 'compact' ? 'compact' : 'comfortable',
    limit:
      typeof value.limit === 'number' &&
      Number.isInteger(value.limit) &&
      value.limit >= 1 &&
      value.limit <= 100
        ? value.limit
        : defaults.limit,
    note: typeof value.note === 'string' ? value.note : defaults.note,
  };
}
