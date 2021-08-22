import type { Queue } from './index';
import { clear, enqueue, enqueueNow, remove } from './enqueue';
import { html } from './html';
import { goto, gotoNext, gotoPrev, updateText } from './go';
import { move, reverse, set, toggle } from './transform';
import { addToStore } from './add';
import { handleMessage } from './listener';
import { emit, onChange } from './events';

/**
 * Dummy class for method declarations
 * 
 * A interface would require repetition, this way we can declare here and not worry about it in the main class
 * 
 * Initializer in separate method because of type checking
 */
export class QueueMethods {
  enqueue = enqueue;
  enqueueNow = enqueueNow;
  remove = remove;
  clear = clear;
  goto = goto;
  gotoNext = gotoNext;
  gotoPrev = gotoPrev;
  toggle = toggle;
  move = move;
  set = set;
  reverse = reverse;
  addToStore = addToStore;
  handleMessage = handleMessage;
  updateText = updateText;
  onChange = onChange;
  protected emit = emit;
}

export function initElement(this: Queue) {
  const q = document.createElement('div');
  this.containerEl = q;
  q.className = 'enhancer-queue hidden';
  q.innerHTML = html;
  this.elementsEl = q.querySelector('.elements');
  this.titleEl = q.querySelector('.title');
  this.numberEl = q.querySelector('.no');
  this.totalEl = q.querySelector('.of');
  this.prevEl = q.querySelector('.prev');
  this.nextEl = q.querySelector('.next');
  this.shareEl = q.querySelector('.enhancer-queue-share-bg');
  this.shareLinkEl = this.shareEl.querySelector('input[type="text"]');
  this.shareHereEl = this.shareEl.querySelector('input[type="checkbox"]');
  document.body.append(q);
  return q;
}