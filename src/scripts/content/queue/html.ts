import type { Queue } from '.';
import iconClose from '../../../icons/close.svg';
import iconDelete from '../../../icons/delete.svg';
import iconNext from '../../../icons/next.svg';
import iconPlay from '../../../icons/play.svg';
import iconReverse from '../../../icons/reverse.svg';
import iconShare from '../../../icons/share.svg';
import { getBrowserInstance } from '../../helpers/sharedExt';

const nothingToPlay = getBrowserInstance().i18n.getMessage('pageNothingToPlay');
const share = getBrowserInstance().i18n.getMessage('pageShareQueue');
const link = getBrowserInstance().i18n.getMessage('pageShareLink');
const starthere = getBrowserInstance().i18n.getMessage('pageShareStartHere');

export const html = `
<div class="enhancer-queue-inner">
  <div class="top">
    <div class="current">
      <span class="title">${nothingToPlay}</span>
      <span class="no">-</span> / <span class="of">0</span>
      <span class="prev" role="queue-previous">${iconNext}</span><span class="next" role="queue-next">${iconNext}</span>
      <span class="reverse clickable">${iconReverse}</span>
    </div>
    <span class="share clickable">${iconShare}</span>
    <span class="close clickable" role="queue-close">${iconClose}</span>
  </div>
  <div class="elements"></div>
</div>
<div class="enhancer-queue-share-bg hidden">
  <div class="enhancer-queue-share">
    <div class="top">
      <h2 class="current">${share}</h2>
      <div class="close clickable" role="share-close">${iconClose}</div>
    </div>
    <div class="body">
      <div class="enhancer-field">
        <div class="enhancer-control">
          <input type="text" readonly id="enhancer-share-link" class="enhancer-text-input has-value" />
          <label for="enhancer-share-link">${link}</label>
        </div>
      </div>
      <div class="enhancer-field">
        <label class="enhancer-checkbox">
          <input type="checkbox" checked />
          ${starthere}
        </label>
      </div>
    </div>
  </div>
</div>
`;

export function render(this: Queue, checkOnVideo = true) {
  const root = this.elementsEl;
  while (root.children.length > this.queue.length) root.removeChild(root.lastElementChild);
  while (root.children.length < this.queue.length) {
    const n = root.appendChild(document.createElement('div'));
    n.className = 'element';
    n.innerHTML = `
        <div class="drag"><span class="up clickable">${iconNext}</span><span class="handle">&#x2630;</span><span class="down clickable">${iconNext}</span></div>
        <div class="thumb">
          <img class="thumbnail" draggable="false" />
          <div class="play">${iconPlay}</div>
        </div>
        <div class="data">
          <span class="title"></span>
          <span class="creator"></span>
        </div>
        <div class="remove"><span class="r">${iconDelete}</span></div>
      `;
    n.draggable = true;
  }

  for (let i = 0; i < this.queue.length; i++) {
    const n = root.children[i] as HTMLElement;
    const name = this.queue[i];
    const isOnVideo = this.queuepos === i && location.pathname === `/videos/${this.queue[this.queuepos]}`;
    n.querySelector<HTMLImageElement>('.thumbnail').src = this.store[name].thumbnail;
    n.querySelector('.title').textContent = this.store[name].title;
    n.querySelector('.creator').textContent = `${this.store[name].creator} • ${this.store[name].length}`;
    n.className = 'element';
    n.classList.toggle('playing', checkOnVideo ? isOnVideo : i === this.queuepos);
    n.style = '';
  }
  this.updateText(checkOnVideo);
};