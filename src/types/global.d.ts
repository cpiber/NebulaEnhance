interface Array<T> {
  equals(other: Array<T>): boolean;
  occurence(): { values: Array<T>, occurences: Array<number>; };
}

interface ObjectConstructor {
  keys<T extends { [key: string]: any; }>(o: T): Array<keyof T>;
}

interface Number {
  pad(length: number): string;
}

declare function cloneInto<T>(object: T, targetWindow: Window, options?: { cloneFunctions?: boolean; }): T;
declare function exportFunction<T extends () => any>(fn: T, targetWindow?: Window, options?: { defineAs?: string, }): T;
interface Window {
  wrappedJSObject: Window;
}

declare const __YT_API_KEY__: string;
declare const __DEV__: boolean;
declare const __MV3__: boolean;

interface Console {
  dev: Pick<Console, 'log' | 'debug' | 'warn' | 'error'>;
}