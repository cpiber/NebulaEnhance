export const videosettings = {
  playbackRate: null as number,
  volume: null as number,
  quality: null as number,
  subtitles: null as string,
};

export type ytvideo = {
  confidence: number,
  video: string,
};

export const videoUrlMatch = /^\/videos\/(.+?)\/?$/;

Array.prototype.occurence = function <T>(this: Array<T>) {
  return [...this].sort().reduce((prev, cur) => {
    if (cur === prev.values[prev.values.length - 1]) {
      prev.occurences[prev.occurences.length - 1]++; // increase frequency
      return prev;
    }
    // new element
    prev.values.push(cur);
    prev.occurences.push(1);
    return prev;
  }, { values: [] as Array<T>, occurences: [] as Array<number> });
};
Array.prototype.equals = function <T>(this: Array<T>, other: Array<T>) {
  return this.length === other.length && this.every((v, i) => v === other[i]); 
};
Number.prototype.pad = function (this: number, length: number) {
  return ('' + this).padStart(length, '0'); 
};

export const dot = (t1: number[], t2: number[]) => t1.length === t2.length && t1.reduce((prev, cur, index) => prev + cur * t2[index], 0);
export const norm = (t: number[]) => Math.sqrt(t.reduce((p, v) => p + v * v, 0));

export const mutation = (func: () => void, time = 500) => {
  let timeout = 0;
  return () => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(func, time);
  };
};

export const isMobile = () => window.matchMedia('(any-pointer: coarse), (any-hover: none)').matches;
export const isVideoPage = () => !!window.location.pathname.match(videoUrlMatch);
export const isVideoListPage = () => !!window.location.pathname.match(/^\/(?:|videos\/?|myshows\/?)$/);
export const clone = typeof cloneInto !== 'undefined' ? <T>(data: T) => cloneInto(data, document.defaultView) : <T>(data: T) => data; // Firefox specific

export function injectScript(node: HTMLElement, content: string, friendly?: string, data?: any, w?: Window): Promise<void>;
export function injectScript(file: string, node: HTMLElement, friendly?: string, data?: any, w?: Window): Promise<void>;
export function injectScript(arg1: HTMLElement | string, arg2: HTMLElement | string, friendly?: string, data?: any, w = window) {
  return new Promise((resolve, reject) => {
    const gotSrc = typeof (arg2 as HTMLElement).appendChild !== 'undefined';
    const n = gotSrc ? arg2 as HTMLElement : arg1 as HTMLElement;
    const f = gotSrc ? arg1 as string      : arg2 as string;

    const s = w.document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    const end = () => {
      s.remove();
      if (data) w.document.dispatchEvent(new w.CustomEvent(`enhancer-load-${friendly}`, clone({ detail: data })));
      resolve(void 0);
    };
    s.addEventListener('load', end);
    s.addEventListener('error', ev => {
      s.remove();
      reject(ev);
    });
    if (gotSrc)
      s.setAttribute('src', f);
    else
      s.textContent = f;
    n.appendChild(s);
    if (!gotSrc)
      end(); // no on-load, do it manually
  });
}

export const sendMessage = <T>(name: string, data?: { [key: string]: any }, expectAnswer = true, skipOriginCheck = false) => {
  if (!expectAnswer) {
    window.parent.postMessage(JSON.stringify({ type: name, ...data }), '*');
    return Promise.resolve(undefined);
  }
  return new Promise<T>((resolve, reject) => {
    const e = `enhancer-message-${Math.random().toString().substr(2)}`;
    const c = (ev: MessageEvent) => {
      sendMessageCB(resolve, reject, e, skipOriginCheck, c, ev);
    };
    window.addEventListener('message', c);
    window.parent.postMessage(JSON.stringify({ type: name, name: e, ...data }), '*');
  });
};

const sendMessageCB = (resolve: (value: any) => void, reject: (value: any) => void, eventName: string,
  skipOriginCheck: boolean, self: (ev: MessageEvent) => void, ev: MessageEvent) => {
  if (!skipOriginCheck && !ev.origin.match(/https?:\/\/(?:watchnebula.com|(?:.+\.)?nebula.app)/)) return;
  let d = ev.data;
  try {
    d = JSON.parse(d);
  } catch (err) {
  }
  const msg = (typeof d === 'string' ? { type: d } : d) as { type: string, err: any, res: any };
  if (msg.type !== eventName) return;
  window.removeEventListener('message', self);
  if (msg.err)
    reject(msg.err);
  else
    resolve(msg.res);
};

export const getCookie = (name: string) => {
  const cookieArr = document.cookie.split(';');
  for (const cookie of cookieArr) {
    const cookiePair = cookie.split('=');
    
    if(name == cookiePair[0].trim()) {
      return decodeURIComponent(cookiePair[1]);
    }
  }
  
  return null;
};