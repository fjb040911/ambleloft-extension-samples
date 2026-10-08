import { get } from 'node:http';
import type { ClientRequest, IncomingMessage } from 'node:http';
export interface BusinessEvent {
  eventId: string;
  taskId: string;
  kind: 'progress' | 'withdraw';
  version: number;
  title: string;
  body: string;
}
// One instance per extension backend; page windows never connect to the service.
export class PushConnection {
  state = 'disconnected';
  attempt = 0;
  received = 0;
  lastEvent = '';
  lastError = '';
  private generation = 0;
  private request?: ClientRequest;
  private response?: IncomingMessage;
  private timer?: ReturnType<typeof setTimeout>;
  private address = '';
  private chain = Promise.resolve();
  constructor(private consume: (event: BusinessEvent, current: () => boolean) => Promise<void>) {}
  configure(address: string, enabled: boolean) {
    if (
      address === this.address &&
      enabled &&
      ['connected', 'connecting', 'reconnecting'].includes(this.state)
    )
      return;
    this.dispose();
    this.address = address;
    if (!enabled) return;
    if (!address) {
      this.state = 'unconfigured';
      return;
    }
    try {
      const u = new URL(address);
      if (
        u.protocol !== 'http:' ||
        u.hostname !== '127.0.0.1' ||
        u.username ||
        u.password ||
        u.pathname !== '/events' ||
        u.search ||
        u.hash
      )
        throw Error();
    } catch {
      this.state = 'invalid-address';
      return;
    }
    this.attempt = 0;
    this.connect(this.generation);
  }
  private connect(g: number) {
    if (g !== this.generation) return;
    this.state = this.attempt ? 'reconnecting' : 'connecting';
    let buffer = '',
      ended = false;
    const retry = () => {
      if (ended || g !== this.generation) return;
      ended = true;
      this.request?.destroy();
      this.response?.destroy();
      this.state = 'reconnecting';
      this.lastError = 'CONNECTION_LOST';
      const delay = Math.min(8000, 250 * 2 ** Math.min(this.attempt++, 5));
      this.timer = setTimeout(() => this.connect(g), delay);
    };
    this.request = get(this.address, (res) => {
      this.response = res;
      if (res.statusCode !== 200) {
        retry();
        return;
      }
      this.state = 'connected';
      this.attempt = 0;
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        buffer += chunk;
        if (buffer.length > 128 * 1024) {
          retry();
          return;
        }
        let end;
        while ((end = buffer.indexOf('\n\n')) >= 0) {
          const block = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          const raw = block
            .split('\n')
            .find((l) => l.startsWith('data: '))
            ?.slice(6);
          if (!raw) continue;
          let e: BusinessEvent;
          try {
            e = JSON.parse(raw);
            if (
              !e ||
              typeof e.eventId !== 'string' ||
              !e.eventId ||
              e.eventId.length > 160 ||
              typeof e.taskId !== 'string' ||
              !e.taskId ||
              e.taskId.length > 200 ||
              !['progress', 'withdraw'].includes(e.kind) ||
              !Number.isSafeInteger(e.version) ||
              e.version < 1 ||
              typeof e.title !== 'string' ||
              e.title.length > 200 ||
              typeof e.body !== 'string' ||
              e.body.length > 20000
            )
              throw Error();
          } catch {
            this.lastError = 'INVALID_EVENT';
            continue;
          }
          if (this.received >= 10000) {
            this.lastError = 'EVENT_LIMIT';
            this.dispose();
            return;
          }
          this.received++;
          this.lastEvent = e.eventId;
          this.chain = this.chain
            .then(async () => {
              if (g === this.generation) await this.consume(e, () => g === this.generation);
            })
            .catch((error) => {
              this.lastError = typeof error?.code === 'string' ? error.code : 'INTERNAL';
            });
        }
      });
      res.on('end', retry);
      res.on('error', retry);
    });
    this.request.setTimeout(15000, retry);
    this.request.on('error', retry);
  }
  dispose() {
    this.generation++;
    clearTimeout(this.timer);
    this.request?.destroy();
    this.response?.destroy();
    this.state = 'disconnected';
  }
  snapshot() {
    return {
      state: this.state,
      attempt: this.attempt,
      received: this.received,
      lastEvent: this.lastEvent,
      lastError: this.lastError,
    };
  }
}
