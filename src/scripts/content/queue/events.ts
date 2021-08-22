import type { Queue, Listener } from './index';

export function onChange(this: Queue, listener: Listener) {
  this.listeners.push(listener);
}

export function emit(this: Queue) {
  for (const l of this.listeners) {
    try {
      l(this);
    } catch (err) {
      console.error(err);
    }
  }
}