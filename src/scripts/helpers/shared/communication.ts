import { Event, Message } from './constants';
import { clone, parseTypeObject } from './helpers';

export function sendMessage(name: Message.GET_MESSAGE, data: { message: string; }): Promise<string>;
export function sendMessage(name: Message.GET_QSTATUS): Promise<{ canNext: boolean, canPrev: boolean, position: number, length: number; }>;
export function sendMessage<T>(name: Exclude<Message, Message.GET_MESSAGE | Message.GET_QSTATUS>, data?: { [key: string]: any; }, expectAnswer?: boolean, skipOriginCheck?: boolean): Promise<T>;
export function sendMessage<T>(name: Message, data?: { [key: string]: any; }, expectAnswer = true, skipOriginCheck = false) {
  console.dev.debug('Sending message', name, 'with data', data);
  if (!expectAnswer) {
    window.parent.postMessage(JSON.stringify({ ...data, type: name }), '*');
    return Promise.resolve(undefined as T);
  }
  return new Promise<T>((resolve, reject) => {
    const e = `enhancer-message-${Math.random().toString().substring(2)}`;
    const c = (ev: MessageEvent) => {
      if (!skipOriginCheck && !ev.origin.match(/https?:\/\/(?:watchnebula\.com|(?:.+\.)?nebula\.(?:app|tv))|https?:\/\/(?:m\.|www\.)youtube\.com/)) return;
      try {
        const msg = parseTypeObject<{ type: string, err?: any, res?: any; }>(ev.data);
        if (msg.type !== e) return;
        window.removeEventListener('message', c);
        if (msg.err)
          reject(msg.err);
        else
          resolve(msg.res);
      } catch { }
    };
    window.addEventListener('message', c);
    window.parent.postMessage(JSON.stringify({ ...data, type: name, name: e }), '*');
  });
}

export type Listener<R = any, E = any> = (res: R, err: E) => void;
export function sendEventHandler(event: Event.QUEUE_CHANGE, listener: Listener<{ canNext: boolean, canPrev: boolean; }>, skipOriginCheck?: boolean): void;
export function sendEventHandler(event: Event.STORAGE_CHANGE, listener: Listener<Parameters<Parameters<typeof browser.storage.onChanged.addListener>[0]>>, skipOriginCheck?: boolean): void;
export function sendEventHandler(event: Exclude<Event, Event.QUEUE_CHANGE | Event.STORAGE_CHANGE>, listener: Listener, skipOriginCheck?: boolean): void;
export function sendEventHandler(event: Event, listener: Listener, skipOriginCheck = false) {
  console.dev.debug('Registering remote listener for', event);
  const e = `enhancer-event-${event}-${Math.random().toString().substring(2)}`;
  const c = (ev: MessageEvent) => {
    if (!skipOriginCheck && !ev.origin.match(/https?:\/\/(?:watchnebula\.com|(?:.+\.)?nebula\.(?:app|tv))/)) return;
    try {
      const msg = parseTypeObject<{ type: string, err?: any, res?: any; }>(ev.data);
      if (msg.type !== e) return;
      listener(msg.res, msg.err);
    } catch { }
  };
  window.addEventListener('message', c);
  window.parent.postMessage(JSON.stringify({ type: Message.REGISTER_LISTENER, name: e, event }), '*');
}

export const replyMessage = (e: MessageEvent, name: string, data?: any, err?: any) => {
  if (!name) return;
  console.dev.debug('Replying to', name, 'with data', data, 'and error', err);
  e.source.postMessage(
    clone({ type: name, res: data, err }),
    // @ts-expect-error Why??
    e.origin,
  );
};