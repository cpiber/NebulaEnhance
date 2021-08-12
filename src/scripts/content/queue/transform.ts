import { extractData } from './add';
import type { Queue } from './index';

export function toggle(this: Queue) {
  const tggl = this.containerEl.classList.toggle('down');
  // disable transitions after it's down
  // or enable now
  // to make sure adding new elements while down does not transition
  if (tggl)
    setTimeout(() => this.containerEl.classList.add('no-transition'), 100);
  else
    this.containerEl.classList.remove('no-transition');
  this.calcBottom(tggl);
}

export function move(this: Queue, orig: number, index: number) {
  const [name, elem] = this.queue.splice2(orig, 1);
  this.queue.splice2(index, 0, name, elem);
  if (this.queuepos >= 0) {
    // adjust index based on new and old positions, difference always 1 (except when moving current)
    if (this.queuepos === orig) this.queuepos = index;
    else if (orig > this.queuepos && index <= this.queuepos) this.queuepos++;
    else if (orig < this.queuepos && index >= this.queuepos) this.queuepos--;
  }
  this.updateText();
  return elem[0];
}

export async function set(this: Queue, newq: string[], current?: string): Promise<string[]>;
export async function set(this: Queue, newq: Nebula.Video[], current?: string): Promise<string[]>;
export async function set(this: Queue, newq: string[] | Nebula.Video[], current?: string) {
  if (newq.length === 0)
    return this.clear();

  const q = newq.findIndex(e => typeof e !== "string") === -1 ? await setStr.call(this, newq as string[]) : setVid.call(this, newq as Nebula.Video[]);
  
  this.queue.splice2(0, this.queue.length, q); // replace current queue
  if (current)
    // use timeout to make sure dom is updated
    setTimeout(() => this.goto(this.queue.indexOf(current), false), 0);
  else
    this.updateText(); // new queue, nothing playing
  this.containerEl.classList.toggle('hidden', q.length === 0);
  this.calcBottom(this.containerEl.classList.contains('down'));
  return q;
}

async function setStr(this: Queue, newq: string[]) {
  // check if they're already same
  if (newq.length === this.queue.length && newq.equals(this.queue))
    return;
  // wait for all to be added (requests from api if needed)
  // filters queue to valid elements
  return (await Promise.all(newq.map(v => this.addToStore(v).catch(console.error))))
    .map((v, i) => v !== undefined ? newq[i] : undefined).filter(e => e !== undefined);
}

function setVid(this: Queue, newq: Nebula.Video[]) {
  // check if they're already same
  const slugs = newq.map(v => v.slug);
  if (newq.length === this.queue.length && slugs.equals(this.queue))
    return;
  // add all to store
  newq.forEach(v => this.store[v.slug] = extractData(v));
  return slugs;
}

export function reverse(this: Queue) {
  this.queue.reverse2();
  if (this.queuepos !== -1) {
    this.queuepos = this.queue.length - this.queuepos - 1;
    this.updateText();
    this.elementsEl.querySelector('.playing').scrollIntoView();
  }
}