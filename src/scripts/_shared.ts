import 'webextension-polyfill';

export function getBrowserInstance(): typeof browser {
    // Get extension api Chrome or Firefox
    // @ts-ignore
    // const browserInstance = browser || (window as any)['browser'] || window.chrome;
    // return browserInstance;

    // polyfilled
    return globalThis.browser;
}