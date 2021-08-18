import type { Queue } from './index';

let enqueueAnim = false;

export function enqueue (this: Queue, name: string | string[], pos?: number) {
  if (typeof name === 'string') {
    if (!this.store[name])
      throw new Error('Not in store!');
  } else {
    name.forEach(n => {
      if (!this.store[n])
        throw new Error('Not in store!');
    });
  }
  
  const q = typeof name === 'string' ? [name] : name;
  if (pos !== undefined)
    this.queue.splice2(pos, 0, q);
  else if (this.queue[this.queue.length - 1] !== name)
    this.queue.splice2(this.queue.length, 0, q);
  this.containerEl.classList.remove('hidden');
  this.calcBottom(this.containerEl.classList.contains('down'));

  // play little animation to show something was added
  if (enqueueAnim)
    return;
  enqueueAnim = true;
  setTimeout(() => {
    const top = this.elementsEl.scrollTop;
    this.elementsEl.scrollTop += 10;
    window.setTimeout(() => {
      this.elementsEl.scrollTop = top;
      window.setTimeout(() => enqueueAnim = false, 500);
    }, 200);
  }, 0);
}

export function enqueueNow(this: Queue, name: string) {
  if (this.queue[this.queuepos] !== name && this.queue[this.queuepos + 1] !== name)
    this.enqueue(name, this.queuepos + 1);
}

export function remove(this: Queue, index: number) {
  if (index < 0 || index >= this.queue.length) return;
  if (this.queue.length === 1) return this.clear();
  this.queue.splice2(index, 1);
  if (this.queuepos >= 0 && index <= this.queuepos) {
    --this.queuepos;
    this.updateText();
  }
}

export function clear(this: Queue ) {
  this.queuepos = -1;
  this.queue.splice2(0, this.queue.length);
  this.containerEl.classList.add('hidden');
}