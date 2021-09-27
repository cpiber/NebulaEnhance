import browser from 'webextension-polyfill';
export * from './shared';

export const getBrowserInstance = () => browser; // poly-filled
export const isChrome = () => (window as any).chrome !== undefined;

export function getFromStorage<T extends { [key: string]: any }>(key: T): Promise<T>;
export function getFromStorage(key: string | string[] | { [key: string]: any }) {
  return (getBrowserInstance().storage.sync || getBrowserInstance().storage.local).get(key);
}