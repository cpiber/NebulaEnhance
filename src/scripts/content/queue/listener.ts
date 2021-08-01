import { getBrowserInstance } from '../../helpers/sharedBrowser';
import type { Queue } from './index';

const confirmClear = getBrowserInstance().i18n.getMessage('pageQueueClearConfirm');

export function clickElements(this: Queue, e: MouseEvent) {
  const el = (e.target as HTMLElement).closest('.element');
  if (el === null)
    return;
  e.preventDefault();
  const i = Array.from(el.parentElement.children).findIndex(n => n.isSameNode(el));
  if (i === -1)
    return;
  const r = (e.target as HTMLElement).closest('.r');
  if (r === null)
    this.goto(i);
  else
    this.remove(i);
}

export function clickTop(this: Queue, e: MouseEvent) {
  e.preventDefault();
  const c = (e.target as HTMLElement).closest('.close');
  if (c !== null)
    return confirm(confirmClear) ? this.clear() : null;
  const s = (e.target as HTMLElement).closest('.share');
  if (s !== null)
    return this.setShare();
  const r = (e.target as HTMLElement).closest('.reverse');
  if (r !== null)
    return this.reverse();
  const p = (e.target as HTMLElement).closest('.prev');
  if (p !== null)
    return this.gotoPrev();
  const n = (e.target as HTMLElement).closest('.next');
  if (n !== null)
    return this.gotoNext();
  this.toggle();
}

const next = Object.assign(function (this: Queue) {
  if (!next.waitEnd)
    return;
  this.gotoNext();
  next.waitEnd = false;
  window.clearTimeout(next.timeout);
}, { waitEnd: false, timeout: 0 });

export function msg(this: Queue, e: MessageEvent) {
  if (e.origin !== "https://player.zype.com" && e.origin !== "http://player.zype.com")
    return;
  try {
    const m = JSON.parse(e.data);
    switch (m.event) {
      case "zype:complete":
        next.timeout = window.setTimeout(next.bind(this), 5000); // timeout to ensure next is reached even without second event
        next.waitEnd = true;
        break;
      case "zype:pause":
        if (next.waitEnd) next.apply(this); // only if complete reached
        break;
    }
  } catch { }
}

export function popState(this: Queue) {
  const match = window.location.pathname.match(/^\/videos\/(.+?)\/?$/);
  if (match === null) return this.goto(-1, false);
  this.goto(this.queue.indexOf(match[1]), false);
}