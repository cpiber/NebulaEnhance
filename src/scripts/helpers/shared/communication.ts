import { Events, Message } from './constants';
import { clone, parseTypeObject } from './helpers';

export function sendMessage(name: Message.GET_MESSAGE, data: { message: string }): Promise<string>;
export function sendMessage(name: Message.GET_QSTATUS): Promise<{ canNext: boolean, canPrev: boolean, position: number, length: number }>;
export function sendMessage<T>(name: Exclude<Message, Message.GET_MESSAGE | Message.GET_QSTATUS>, data?: { [key: string]: any }, expectAnswer?: boolean, skipOriginCheck?: boolean): Promise<T>;
export function sendMessage<T>(name: Message, data?: { [key: string]: any }, expectAnswer = true, skipOriginCheck = false) {
  if (!expectAnswer) {
    window.parent.postMessage(JSON.stringify({ ...data, type: name }), '*');
    return Promise.resolve(undefined as T);
  }
  return new Promise<T>((resolve, reject) => {
    const e = `enhancer-message-${Math.random().toString().substr(2)}`;
    const c = (ev: MessageEvent) => {
      if (!skipOriginCheck && !ev.origin.match(/https?:\/\/(?:watchnebula.com|(?:.+\.)?nebula.app)/)) return;
      try {
        const msg = parseTypeObject<{ type: string, err?: any, res?: any }>(ev.data);
        if (msg.type !== e) return;
        window.removeEventListener('message', c);
        if (msg.err)
          reject(msg.err);
        else
          resolve(msg.res);
      } catch {}
    };
    window.addEventListener('message', c);
    window.parent.postMessage(JSON.stringify({ ...data, type: name, name: e }), '*');
  });
}

export type Listener<R = any, E = any> = (res: R, err: E) => void;
export function sendEventHandler(event: Events.QUEUE_CHANGE, listener: Listener<{ canNext: boolean, canPrev: boolean }>, skipOriginCheck?: boolean): void;
export function sendEventHandler(event: Exclude<Events, Events.QUEUE_CHANGE>, listener: Listener, skipOriginCheck?: boolean): void;
export function sendEventHandler(event: Events, listener: Listener, skipOriginCheck = false) {
  const e = `enhancer-event-${event}-${Math.random().toString().substr(2)}`;
  const c = (ev: MessageEvent) => {
    if (!skipOriginCheck && !ev.origin.match(/https?:\/\/(?:watchnebula.com|(?:.+\.)?nebula.app)/)) return;
    try {
      const msg = parseTypeObject<{ type: string, err?: any, res?: any }>(ev.data);
      if (msg.type !== e) return;
      listener(msg.res, msg.err);
    } catch {}
  };
  window.addEventListener('message', c);
  window.parent.postMessage(JSON.stringify({ type: Message.REGISTER_LISTENER, name: e, event }), '*');
}

export const replyMessage = (e: MessageEvent, name: string, data?: any, err?: any) => name &&
  e.source.postMessage(
    clone({ type: name, res: data, err }),
    // @ts-expect-error Why??
    e.origin,
  );