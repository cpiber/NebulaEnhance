import { getBrowserInstance } from '../../helpers/sharedExt';
import type { Queue } from './index';

const nothingToPlay = getBrowserInstance().i18n.getMessage('pageNothingToPlay');

export function goto(this: Queue, index: number, go = true) {
  if (index < 0 || index >= this.queue.length) return;
  this.elementsEl.children[this.queuepos]?.classList.remove('playing');
  this.queuepos = index;
  if (go) {
    const url = `/videos/${this.queue[index]}`;
    // trick router into accepting my url without reloading page
    // sadly, we can't really remove the fake states, it completely breaks
    // we also need a fake '/', otherwise the player vanishes
    setTimeout(() => {
      window.history.pushState({ fake: true }, null, '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.history.pushState({ fake: true }, null, url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, 0);
    console.debug(`Queue: Navigating to ${url}`);
  }
  if (index >= 0) {
    this.elementsEl.children[index]?.classList.add('playing');
    this.elementsEl.children[index]?.scrollIntoView();
  }
  this.updateText();
  // chrome does not do this for us
  const yt = document.querySelector('.enhancer-yt');
  if (yt) {
    yt.previousElementSibling.remove();
    yt.remove();
  }
  document.querySelector('.enhancer-yt-err')?.remove();
}

export function gotoNext(this: Queue) {
  return this.goto(this.queuepos + 1);
}

export function gotoPrev(this: Queue) {
  return this.goto(this.queuepos - 1);
}

export function updateText(this: Queue) {
  this.titleEl.textContent = this.queuepos >= 0 ? this.store[this.queue[this.queuepos]]?.title : nothingToPlay;
  this.numberEl.textContent = this.queuepos >= 0 ? `${this.queuepos + 1}` : '-';
  this.totalEl.textContent = `${this.queue.length}`;
  this.prevEl.classList.toggle('clickable', this.canGoPrev());
  this.nextEl.classList.toggle('clickable', this.canGoNext());
  this.setStorage();
  this.emit();
}