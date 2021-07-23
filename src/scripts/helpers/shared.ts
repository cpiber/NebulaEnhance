export const videosettings = {
  playbackRate: null as number,
  volume: null as number,
  quality: null as number,
  subtitles: null as string
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
Array.prototype.equals = function <T>(this: Array<T>, other: Array<T>) { return this.length === other.length && this.every((v, i) => v === other[i]); }
Number.prototype.pad = function (this: number, length: number) { return ("" + this).padStart(length, "0"); }

export const dot = (t1: number[], t2: number[]) => t1.length === t2.length && t1.reduce((prev, cur, index) => prev + cur * t2[index], 0)
export const norm = (t: number[]) => Math.sqrt(t.reduce((p, v) => p + v * v, 0));

export const mutation = (func: () => void) => {
  let timeout = 0;
  return () => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(func, 500);
  };
};

export const isMobile = () => window.matchMedia("(any-pointer: coarse), (any-hover: none)").matches;
export const isVideoPage = () => !!window.location.pathname.match(videoUrlMatch);

export function injectScript(node: HTMLElement, content: string, friendly?: string, data?: any, w?: Window): Promise<void>;
export function injectScript(file: string, node: HTMLElement, friendly?: string, data?: any, w?: Window): Promise<void>;
export function injectScript(arg1: HTMLElement | string, arg2: HTMLElement | string, friendly?: string, data?: any, w = window) {
  return new Promise((resolve, reject) => {
    const gotSrc = typeof (arg2 as HTMLElement).appendChild !== "undefined";
    const n = gotSrc ? arg2 as HTMLElement : arg1 as HTMLElement;
    const f = gotSrc ? arg1 as string      : arg2 as string;

    const s = w.document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    const end = () => {
      s.remove();
      if (data) w.document.dispatchEvent(new w.CustomEvent(`enhancer-load-${friendly}`, { detail: data }));
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