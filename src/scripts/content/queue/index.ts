import { getBrowserInstance } from '../../helpers/sharedBrowser';
import { Store, VideoArray } from '../../helpers/VideoQueue';
import { initDrag } from './drag';
import { initElement, initMethods, QueueMethods } from './init';
import { clickElements, clickTop, msg, popState } from './listener';

const nothingToPlay = getBrowserInstance().i18n.getMessage('pageNothingToPlay');

export class Queue extends QueueMethods {
  protected static instance: Queue;

  protected store: Store = {};
  protected queue: VideoArray;
  protected queuepos = -1;
  
  protected containerEl: HTMLElement;
  protected elementsEl: HTMLElement;
  protected titleEl: HTMLElement;
  protected numberEl: HTMLElement;
  protected shareEl: HTMLElement;
  protected shareLinkEl: HTMLInputElement;
  protected shareHereEl: HTMLInputElement;

  protected constructor() {
    super();
    Object.setPrototypeOf(this, Queue.prototype);
    initMethods.apply(this);

    // remove existing elements from extension reload
    Array.from(document.querySelectorAll('.enhancer-queue')).forEach(n => n.remove());

    const { q, o } = initElement.apply(this);

    this.queue = new VideoArray(this.elementsEl, function (this: VideoArray) { o.textContent = `${this.length}`; }, this.store);

    this.elementsEl.addEventListener('click', clickElements.bind(this));
    q.querySelector('.top').addEventListener('click', clickTop.bind(this));
    window.addEventListener('message', msg.bind(this));
    window.addEventListener('popstate', popState.bind(this));

    this.shareEl.querySelector('.close').addEventListener('click', () => this.shareEl.classList.add('hidden'));
    this.shareLinkEl.addEventListener('click', ev => (ev.target as HTMLInputElement).select());
    this.shareHereEl.addEventListener('change', this.setShare.bind(this));

    initDrag.apply(this);
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  calcBottom(down: boolean) {
    if (down)
      this.containerEl.style.bottom = `-${this.elementsEl.getBoundingClientRect().height}px`;
    else
      this.containerEl.style.bottom = '';
  }

  updateText() {
    this.titleEl.textContent = this.store[this.queue[this.queuepos]]?.title;
    this.numberEl.textContent = this.queuepos >= 0 ? `${this.queuepos + 1}` : '-';
  }

  clearText() {
    this.titleEl.textContent = nothingToPlay;
    this.numberEl.textContent = '-';
  }

  setShare() {
    const base = this.shareHereEl.checked && this.queuepos >= 0 ? `${window.location.origin}/videos/${this.queue[this.queuepos]}` : window.location.origin;
    const hash = this.queue.join(',');
    this.shareLinkEl.value = `${base}/#${hash}`;
    this.shareEl.classList.remove('hidden');
  }


  static get() {
    return this.instance ? this.instance : this.instance = new this();
  }
}