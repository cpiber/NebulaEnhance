interface Array<T> {
  equals(other: Array<T>): boolean;
  occurence(): { values: Array<T>, occurences: Array<number>};
}

interface ObjectConstructor {
  keys<T extends { [key: string]: any }>(o: T): Array<keyof T>;
}

interface Number {
  pad(length: number): string;
}

type Instance<T> = T extends new (...args: any[]) => infer U ? U : never;

declare function cloneInto<T>(object: T, targetWindow: Window, options?: { cloneFunctions?: boolean }): T;
declare function exportFunction<T extends Function>(fn: T, targetWindow?: Window, options?: { defineAs?: string, }): T;
interface Window {
  wrappedJSObject: Window;
}

declare const __YT_API_KEY__: string;
declare const __DEV__: boolean;