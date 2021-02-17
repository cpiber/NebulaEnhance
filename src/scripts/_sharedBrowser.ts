import 'webextension-polyfill';

// @ts-ignore
export const c = typeof cloneInto !== "undefined" ? <T>(data: T) => cloneInto(data, document.defaultView) as T : <T>(data: T) => data;

export function getBrowserInstance() {
    // Get extension api Chrome or Firefox
    // @ts-ignore
    // const browserInstance = browser || (window as any)['browser'] || window.chrome;
    // return browserInstance as typeof browser;

    // polyfilled
    return globalThis.browser;
}