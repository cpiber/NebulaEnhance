import browser from 'webextension-polyfill';

// @ts-ignore
export const c = typeof cloneInto !== "undefined" ? <T>(data: T) => cloneInto(data, document.defaultView) as T : <T>(data: T) => data;

export function getBrowserInstance() {
    // Get extension api Chrome or Firefox
    // @ts-ignore
    // const browserInstance = browser || (window as any)['browser'] || window.chrome;
    // return browserInstance as typeof browser;
    
    // polyfilled
    // return globalThis.browser;
    return browser;
}

export function isChrome() {
    return (window as any).chrome !== undefined;
}

export function injectScript(node: HTMLElement, content: string, friendly?: string, data?: any): Promise<void>;
export function injectScript(file: string, node: HTMLElement, friendly?: string, data?: any): Promise<void>;
export function injectScript(file: any, node: any, friendly?: string, data?: any) {
    return new Promise(resolve => {
        const gotSrc = typeof (node as HTMLElement).appendChild !== "undefined";
        const n: HTMLElement = gotSrc ? node : file;
        const f: string = gotSrc ? file : node;

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