import { clone, parseTypeObject } from './helpers';

export const sendMessage = <T>(name: string, data?: { [key: string]: any }, expectAnswer = true, skipOriginCheck = false) => {
  if (!expectAnswer) {
    window.parent.postMessage(JSON.stringify({ ...data, type: name }), '*');
    return Promise.resolve(undefined as T);
  }
  return new Promise<T>((resolve, reject) => {
    const e = `enhancer-message-${Math.random().toString().substr(2)}`;
    const c = (ev: MessageEvent) => {
      if (!skipOriginCheck && !ev.origin.match(/https?:\/\/(?:watchnebula.com|(?:.+\.)?nebula.app)/)) return;
      const msg = parseTypeObject<{ type: string, err?: any, res?: any }>(ev.data);
      if (msg.type !== e) return;
      window.removeEventListener('message', c);
      if (msg.err)
        reject(msg.err);
      else
        resolve(msg.res);
    };
    window.addEventListener('message', c);
    window.parent.postMessage(JSON.stringify({ ...data, type: name, name: e }), '*');
  });
};

export type Listener = (res: any, err: any) => void;
export const sendEventHandler = (event: string, listener: Listener, skipOriginCheck = false) => {
  const e = `enhancer-event-${event}-${Math.random().toString().substr(2)}`;
  const c = (ev: MessageEvent) => {
    if (!skipOriginCheck && !ev.origin.match(/https?:\/\/(?:watchnebula.com|(?:.+\.)?nebula.app)/)) return;
    const msg = parseTypeObject<{ type: string, err?: any, res?: any }>(ev.data);
    if (msg.type !== e) return;
    listener(msg.res, msg.err);
  };
  window.addEventListener('message', c);
  window.parent.postMessage(JSON.stringify({ type: 'registerListener', name: e, event }), '*');
};

export const replyMessage = (e: MessageEvent, name: string, data?: any, err?: any) => name &&
  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  e.source.postMessage(
    clone({ type: name, res: data, err: err }),
    e.origin,
  );