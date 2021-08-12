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

declare function cloneInto<T>(object: T, targetWindow: Window): T;

declare const __YT_API_KEY__: string;