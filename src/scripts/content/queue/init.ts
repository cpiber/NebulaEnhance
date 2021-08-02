import type { Queue } from './index';
import { clear, enqueue, enqueueNow, remove } from './enqueue';
import { html } from './html';
import { goto, gotoNext, gotoPrev } from './go';
import { move, reverse, set, toggle } from './transform';
import { addToStore } from './add';
import { handleMessage } from './listener';

/**
 * Dummy class for method declarations
 * 
 * A interface would require repetition, this way we can declare here and not worry about it in the main class
 * 
 * Initializer in separate method because of type checking
 */
export class QueueMethods {
  enqueue: typeof enqueue;
  enqueueNow: typeof enqueueNow;
  remove: typeof remove;
  clear: typeof clear;
  goto: typeof goto;
  gotoNext: typeof gotoNext;
  gotoPrev: typeof gotoPrev;
  toggle: typeof toggle;
  move: typeof move;
  set: typeof set;
  reverse: typeof reverse;
  addToStore: typeof addToStore;
  handleMessage: typeof handleMessage;
}

export function initElement(this: Queue) {
  const q = document.createElement('div');
  this.containerEl = q;
  q.className = 'enhancer-queue hidden';
  q.innerHTML = html;
  this.elementsEl = q.querySelector('.elements');
  const o = q.querySelector('.of');
  this.titleEl = q.querySelector('.title');
  this.numberEl = q.querySelector('.no');
  this.shareEl = q.querySelector('.enhancer-queue-share-bg');
  this.shareLinkEl = this.shareEl.querySelector('input[type="text"]');
  this.shareHereEl = this.shareEl.querySelector('input[type="checkbox"]');
  document.body.append(q);
  return { q, o };
}

export function initMethods(this: Queue) {
  this.enqueue = enqueue.bind(this);
  this.enqueueNow = enqueueNow.bind(this);
  this.remove = remove.bind(this);
  this.clear = clear.bind(this);
  this.goto = goto.bind(this);
  this.gotoNext = gotoNext.bind(this);
  this.gotoPrev = gotoPrev.bind(this);
  this.toggle = toggle.bind(this);
  this.move = move.bind(this);
  this.set = set.bind(this);
  this.reverse = reverse.bind(this);
  this.addToStore = addToStore.bind(this) as typeof addToStore;
  this.handleMessage = handleMessage.bind(this);
}