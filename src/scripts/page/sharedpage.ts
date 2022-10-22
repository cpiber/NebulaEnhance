import { Message, sendMessage } from '../helpers/shared';
export * from '../helpers/shared';

export function getFromStorage<T extends { [key: string]: any; }>(key: T): Promise<T>;
export function getFromStorage<T>(key: string | string[]): Promise<T>;
export function getFromStorage<T>(key: string | string[] | { [key: string]: any; }) {
  return sendMessage<T>(Message.GET_STORAGE, { get: key });
}