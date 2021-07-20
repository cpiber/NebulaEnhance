import browser from 'webextension-polyfill';

export const clone = typeof cloneInto !== "undefined" ? <T>(data: T) => cloneInto(data, document.defaultView) : <T>(data: T) => data; // Firefox specific
export const getBrowserInstance = () => browser; // poly-filled
export const isChrome = () => (window as any).chrome !== undefined;