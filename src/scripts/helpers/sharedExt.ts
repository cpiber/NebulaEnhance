import browser from 'webextension-polyfill';
export * from './shared';

export const getBrowserInstance = () => browser; // poly-filled
export const isChrome = () => (window as any).chrome !== undefined;

const { sync, local } = browser.storage;
export function getFromStorage<T extends { [key: string]: any }>(key: T): Promise<T>;
export function getFromStorage<T>(key?: string | string[] | null): Promise<T>;
export function getFromStorage<T>(key?: string | string[] | { [key: string]: any } | null) {
  return (sync || local).get(key) as Promise<T>;
}
export function setToStorage(key: { [key: string]: any }) {
  return (sync || local).set(key);
}