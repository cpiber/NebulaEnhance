import browser from 'webextension-polyfill';

export const clone = typeof cloneInto !== "undefined" ? <T>(data: T) => cloneInto(data, document.defaultView) : <T>(data: T) => data; // Firefox specific
export const getBrowserInstance = () => browser; // poly-filled
export const isChrome = () => (window as any).chrome !== undefined;

export function injectScript(node: HTMLElement, content: string, friendly?: string, data?: any): Promise<void>;
export function injectScript(file: string, node: HTMLElement, friendly?: string, data?: any): Promise<void>;
export function injectScript(arg1: HTMLElement | string, arg2: HTMLElement | string, friendly?: string, data?: any) {
    return new Promise(resolve => {
        const gotSrc = typeof (arg2 as HTMLElement).appendChild !== "undefined";
        const n = gotSrc ? arg2 as HTMLElement : arg1 as HTMLElement;
        const f = gotSrc ? arg1 as string      : arg2 as string;

        const s = document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        const end = () => {
            s.remove();
            if (data) document.dispatchEvent(new CustomEvent(`enhancer-load-${friendly}`, { detail: data }));
            resolve(void 0);
        };
        s.addEventListener('load', end);
        if (gotSrc)
            s.setAttribute('src', f);
        else
            s.textContent = f;
        n.appendChild(s);
        if (!gotSrc)
            end(); // no on-load, do it manually
    });
}