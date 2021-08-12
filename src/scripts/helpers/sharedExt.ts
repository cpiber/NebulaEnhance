import browser from 'webextension-polyfill';
export * from './shared';

export const getBrowserInstance = () => browser; // poly-filled
export const isChrome = () => (window as any).chrome !== undefined;