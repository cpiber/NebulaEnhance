export const videoUrlMatch = /^\/videos\/(.+?)\/?$/;

export const dot = (t1: number[], t2: number[]) => t1.length === t2.length && t1.reduce((prev, cur, index) => prev + cur * t2[index], 0);
export const norm = (t: number[]) => Math.sqrt(t.reduce((p, v) => p + v * v, 0));

export const debounce = <T extends any[]>(func: (...args: T) => void, time = 500) => {
  let timeout = 0;
  return (...args: T) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(func, time, ...args);
  };
};

export const arrFromLengthy = <T>(a: { length: number, [k: number]: T; }): T[] => Array.from(a);

export const calcOuterBounds = (e: HTMLElement) => {
  const rects = e.getClientRects();
  console.assert(rects.length > 0, 'expected at least one client rect');
  if (rects.length <= 1) return { rect: rects[0], offset: 0 };
  const oldx = rects[0].x;
  const r = rects[0];
  // calculate rect around all rects (biggest wrap)
  for (let i = 1; i < rects.length; ++i) {
    const x = Math.min(r.x, rects[i].x);
    const y = Math.min(r.y, rects[i].y);
    r.width = Math.max(r.x + r.width, rects[i].x + rects[i].width) - x;
    r.height = Math.max(r.y + r.height, rects[i].y + rects[i].height) - y;
    r.x = x;
    r.y = y;
  }
  return { rect: r, offset: oldx - r.x };
};

export const isMobile = () => window.matchMedia('(any-pointer: coarse), (any-hover: none)').matches;
export const isVideoPage = () => !!window.location.pathname.match(videoUrlMatch);
export const isVideoListPage = () => !!window.location.pathname.match(/^\/(?:|videos\/?|myshows\/?)$/);
export const getBase = () => 'nebula.tv';
export const getApiBase = () => 'nebula.app';
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

export const uploadIsBefore = (upload: number, seconds: number) => {
  const before = Date.now() - seconds * 1000;
  return upload < before;
};
export const uploadIsLongerThan = (duration: number, seconds: number) => {
  return duration > seconds;
};

const timeMapping: Record<string, number> = {
  w: 7 * 24 * 60 * 60,
  d: 24 * 60 * 60,
  h: 60 * 60,
  m: 60,
  s: 1,
};
export const parseTimeString = (str: string, invalidElements: string, localeTimeMappings: string, toUnitStr: (unit: string) => string): number => {
  if (!str.match(/^(\s*\d+\s*[A-Za-z]*)*\s*$/)) throw new Error(invalidElements);
  const units = JSON.parse(localeTimeMappings);
  return Array.from(str.matchAll(/(\d+)\s*([A-Za-z]*)/g)).map(match => {
    const d = match[1];
    const u = match[2].toLowerCase() || 's';
    const unit = u in units ? units[u] : u;
    if (!(unit in timeMapping)) throw new Error(toUnitStr(unit));
    return (+d) * timeMapping[unit];
  }).reduce((acc, v) => acc + v, 0);
};
export const toTimeString = (seconds: number): string => {
  const { str, seconds: rest } = Object.keys(timeMapping)
    .sort((a, b) => timeMapping[a] - timeMapping[b]) // probably not necessary
    .reduceRight(({ str, seconds }, u) => {
      const maxUnit = Math.floor(seconds / timeMapping[u]);
      if (maxUnit > 0) return { str: `${str} ${maxUnit}${u}`, seconds: seconds - maxUnit * timeMapping[u] };
      return { str, seconds };
    }, { str: '', seconds });
  if (!str) return `${Math.floor(rest)}s`;
  console.assert(rest >= 0 && rest < 1, `Expected no rest, got ${rest}`);
  return str.trim();
};
export const parseDuration = (time: string): number => time.split(':').reverse().reduce((sum, v, i) => sum + (+v) * Math.pow(60, i), 0);