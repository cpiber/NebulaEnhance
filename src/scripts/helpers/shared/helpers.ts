export const videoUrlMatch = /^\/videos\/(.+?)\/?$/;

Array.prototype.occurence = function <T> (this: Array<T>) {
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
Array.prototype.equals = function <T> (this: Array<T>, other: Array<T>) {
  return this.length === other.length && this.every((v, i) => v === other[i]);
};
Number.prototype.pad = function (this: number, length: number) {
  return ('' + this).padStart(length, '0');
};
String.prototype.matchAll = String.prototype.matchAll || function (r) {
  let match: RegExpExecArray;
  const regexp = new RegExp(r); // copy as per matchAll spec
  if (regexp.flags.indexOf('g') === -1) throw new TypeError('matchAll must be called with a global RegExp');
  return function* (that: string) {
    while ((match = regexp.exec(that)) !== null)
      yield match;
  }(this);
};

export const dot = (t1: number[], t2: number[]) => t1.length === t2.length && t1.reduce((prev, cur, index) => prev + cur * t2[index], 0);
export const norm = (t: number[]) => Math.sqrt(t.reduce((p, v) => p + v * v, 0));

export const debounce = <T extends any[]>(func: (...args: T) => void, time = 500) => {
  let timeout = 0;
  return (...args: T) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(func, time, ...args);
  };
};

export const arrFromLengthy = <T>(a: { length: number, [k: number]: T; }): T[] => {
  const arr = new Array(a.length);
  for (let i = 0; i < a.length; i++)
    arr[i] = a[i];
  return arr;
};

export const isMobile = () => window.matchMedia('(any-pointer: coarse), (any-hover: none)').matches;
export const isVideoPage = () => !!window.location.pathname.match(videoUrlMatch);
export const isVideoListPage = () => !!window.location.pathname.match(/^\/(?:|videos\/?|myshows\/?)$/);
export const clone = typeof cloneInto !== 'undefined' ?
  <T>(data: T) => cloneInto(data, document.defaultView) : // Firefox specific
  <T>(data: T) => data;
export const devClone = __DEV__ && typeof cloneInto !== 'undefined' ?
  <T>(name: string, data: T, ...names: string[]) => {
    let obj: any = window.wrappedJSObject;
    for (const n of names) obj = obj[n];
    obj[name] = cloneInto(data, document.defaultView, { cloneFunctions: true }); // Firefox specific
  } :
  () => {
    if (!__DEV__) throw new Error('THIS SHOULD NEVER HAVE GOTTEN INTO PROD');
  };
export const devExport = __DEV__ && typeof exportFunction !== 'undefined' ?
  (name: string, fn: () => any, ...names: string[]) => {
    let obj: any = window.wrappedJSObject;
    for (const n of names) obj = obj[n];
    Reflect.defineProperty(obj, name, { get: exportFunction(fn, window) }); // Firefox specific
  } :
  () => {
    if (!__DEV__) throw new Error('THIS SHOULD NEVER HAVE GOTTEN INTO PROD');
  };

export function injectScript(node: HTMLElement, content: string, friendly?: string, data?: any, w?: Window): Promise<void>;
export function injectScript(file: string, node: HTMLElement, friendly?: string, data?: any, w?: Window): Promise<void>;
export function injectScript(arg1: HTMLElement | string, arg2: HTMLElement | string, friendly?: string, data?: any, w = window) {
  return new Promise((resolve, reject) => {
    const gotSrc = typeof (arg2 as HTMLElement).appendChild !== 'undefined';
    const n = gotSrc ? arg2 as HTMLElement : arg1 as HTMLElement;
    const f = gotSrc ? arg1 as string : arg2 as string;

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

export function injectFunction<T extends any[]>(node: HTMLElement, fn: (...args: T) => void, ...args: T) {
  const script = document.createElement('script');
  script.textContent = `(${fn})(${args.map(v => JSON.stringify(v)).join(',')})`;
  node.appendChild(script);
  script.remove();
}

export function injectFunctionWithReturn<T extends any[], R>(node: HTMLElement, fn: (...args: T) => R, ...args: T): Promise<R> {
  return new Promise((resolve, reject) => {
    const e = `enhancer-function-${fn.name}-${Math.random().toString().substring(2)}`;
    const listener = (ev: MessageEvent) => {
      const data = parseTypeObject<{ type: string, ret?: R, err: any; }>(ev.data);
      if (data.type !== e) return;
      window.removeEventListener('message', listener);
      'ret' in data ? resolve(data.ret) : reject(data.err);
    };
    window.addEventListener('message', listener);
    const script = document.createElement('script');
    script.textContent = `(async () => {
      try {
        const ret = await ((${fn})(${args.map(v => JSON.stringify(v)).join(',')}));
        window.postMessage({ type: "${e}", ret });
      } catch (e) {
        window.postMessage({ type: "${e}", err: ''+e });
      }
    })()`;
    node.appendChild(script);
    script.remove();
  });
}

export const getCookie = (name: string) => {
  const cookieArr = document.cookie.split(';');
  for (const cookie of cookieArr) {
    const cookiePair = cookie.split('=');
    if (name == cookiePair[0].trim())
      return decodeURIComponent(cookiePair[1]);
  }

  return null;
};

export const parseMaybeJSON = (data: string) => {
  try {
    return JSON.parse(data);
  } catch (err) {
    return data;
  }
};
export const parseTypeObject = <T extends { type: string; }>(data: string | Record<string, any>, nullable = false): T => {
  const d = typeof data === 'string' ? parseMaybeJSON(data) : data;
  if (typeof d === 'string') return { type: d } as T;
  if (typeof d.type === 'string') return d;
  if (nullable) return null;
  throw new TypeError('not convertible to type-object');
};

/**
 * Class to wrap actions that repeat and can be cancelled
 * yields represent cancellation points
 * yield true to retry, false to abort
 */
export class CancellableRepeatingAction {
  private interval = 0;
  private killtime = 0;
  private running = false;

  async run<Action>(fn: () => Generator<any, Action | boolean> | AsyncGenerator<any, Action | boolean>, timeout: number, kill?: number): Promise<Action> {
    if (this.running) this.cancel();
    this.running = true;
    if (kill) this.killtime = window.setTimeout(this.cancel.bind(this), kill);
    return new Promise<Action>((resolve, reject) => {
      this.interval = window.setInterval(async () => {
        if (!this.running) return reject(this.cancel());
        const gen = fn();
        let last: any = undefined;
        while (true) {
          const ret = await gen.next(last);
          if (!this.running) return reject(this.cancel());
          if (!ret.done) {
            if (ret.value === true) return; // retry (interval)
            if (ret.value === false) return resolve((this.cancel(), undefined)); // cancel
            last = ret.value;
            continue; // fetch next
          }
          this.cancel();
          resolve(ret.value as Action);
        }
      }, timeout);
    });
  }

  cancel() {
    if (!this.running) return;
    window.clearInterval(this.interval);
    window.clearTimeout(this.killtime);
    this.running = false;
  }
}