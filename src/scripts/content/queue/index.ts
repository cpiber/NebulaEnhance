import { Store, VideoArray } from '../../helpers/VideoQueue';
import { initDrag } from './drag';
import { QueueMethods, initElement } from './init';
import { clickElements, clickTop, popState } from './listener';

export type Listener = (q: Queue) => void;

export class Queue extends QueueMethods {
  protected static instance: Queue;

  protected store: Store = {};
  protected queue: VideoArray;
  protected queuepos = -1;

  protected containerEl: HTMLElement;
  protected elementsEl: HTMLElement;
  protected titleEl: HTMLElement;
  protected numberEl: HTMLElement;
  protected totalEl: HTMLElement;
  protected prevEl: HTMLElement;
  protected nextEl: HTMLElement;
  protected shareEl: HTMLElement;
  protected shareLinkEl: HTMLInputElement;
  protected shareHereEl: HTMLInputElement;
  protected listeners: Listener[];

  protected constructor() {
    super();
    Object.setPrototypeOf(this, Queue.prototype);

    // remove existing elements from extension reload
    Array.from(document.querySelectorAll('.enhancer-queue')).forEach(n => n.remove());

    const q = initElement.apply(this);

    this.queue = new VideoArray(this.elementsEl, this.updateText.bind(this), this.store);

    this.elementsEl.addEventListener('click', clickElements.bind(this));
    q.querySelector('.top').addEventListener('click', clickTop.bind(this));
    window.addEventListener('popstate', popState.bind(this));

    this.shareEl.querySelector('.close').addEventListener('click', () => this.shareEl.classList.add('hidden'));
    this.shareLinkEl.addEventListener('click', ev => (ev.target as HTMLInputElement).select());
    this.shareHereEl.addEventListener('change', this.setShare.bind(this));

    initDrag.apply(this);
    this.listeners = [];
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

  setShare() {
    const base = this.shareHereEl.checked && this.queuepos >= 0 ? `${window.location.origin}/videos/${this.queue[this.queuepos]}` : window.location.origin;
    const hash = this.queue.join(',');
    this.shareLinkEl.value = `${base}/#${hash}`;
    this.shareEl.classList.remove('hidden');
  }

  canGoPrev() {
    return this.queuepos > 0;
  }

  canGoNext() {
    return this.queuepos < this.queue.length - 1;
  }


  static get() {
    return this.instance ? this.instance : this.instance = new this();
  }
}