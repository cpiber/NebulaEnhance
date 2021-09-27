import { QUEUE_KEY } from '../../helpers/sharedExt';
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
  if (index < 0 || index >= this.queue.length) return;
  const [ name, elem ] = this.queue.splice2(orig, 1);
  if (this.queuepos >= 0) {
    // adjust index based on new and old positions, difference always 1 (except when moving current)
    if (this.queuepos === orig) this.queuepos = index;
    else if (orig > this.queuepos && index <= this.queuepos) this.queuepos++;
    else if (orig < this.queuepos && index >= this.queuepos) this.queuepos--;
  }
  this.queue.splice2(index, 0, name, elem);
  return elem[0];
}

export async function set(this: Queue, newq: string[], current?: string | number): Promise<string[]>;
export async function set(this: Queue, newq: Nebula.Video[], current?: string | number): Promise<string[]>;
export async function set(this: Queue, newq: string[] | Nebula.Video[], current?: string | number) {
  if (!newq.length)
    return this.clear();

  // assume all elements are of same type
  const q = typeof newq[0] === 'string' ? await setStr.call(this, newq as string[]) : setVid.call(this, newq as Nebula.Video[]);
  if (!q)
    return;

  this.queue.splice2(0, this.queue.length, q); // replace current queue
  if (current !== undefined)
    // use timeout to make sure dom is updated
    setTimeout(() => this.goto(typeof current === 'number' ? current : this.queue.indexOf(current), false), 0);
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
  if (this.queuepos !== -1)
    this.queuepos = this.queue.length - this.queuepos - 1;
  this.queue.reverse2();
  this.elementsEl.querySelector('.playing')?.scrollIntoView();
}

export function setStorage(this: Queue) {
  const data = {
    position: this.queuepos,
    queue: [...this.queue],
    store: this.store,
  };
  try {
    if (data.queue.length)
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify(data));
    else
      window.localStorage.removeItem(QUEUE_KEY);
  } catch (err) {
    console.error(err);
  }
}

// XXX: Yes, loading from localStorage is unsafe
// There is no verification that the data is actually valid
// For now, this is fine, but localStorage can be set by anyone, so I'd like to change this
export async function restoreStorage(this: Queue) {
  const data = window.localStorage.getItem(QUEUE_KEY);
  if (data === null) return; // nothing in the storage
  if (!this.isEmpty())
    return console.debug('Queue: ignoring localStorage, queue not empty');
  const parsed = JSON.parse(data);
  if (parsed.position + 1 >= parsed.queue.length)
    return console.debug('Queue: ignoring queue on last video');
  try {
    Object.keys(parsed.store).forEach((key: string) => this.store[key] = parsed.store[key]);
  } catch {}
  await this.set(parsed.queue, +parsed.position);
  console.debug(`Queue: loaded from localStorage (len ${parsed.queue.length} / pos ${parsed.position})`);
}