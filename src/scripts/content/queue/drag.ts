import { DRAG_HEIGHT, DRAG_INDEX } from '../../helpers/shared';
import type { Queue } from './index';

const dragElement = (e: DragEvent) => {
  const el: HTMLElement = (e.target as HTMLElement).closest('.element');
  if (el === null)
    return e.preventDefault();
  const i = Array.from(el.parentElement.children).findIndex(n => n.isSameNode(el));
  if (i === -1)
    return e.preventDefault();
  const scroll = el.parentElement.scrollTop;
  const h = el.getBoundingClientRect().height;
  e.dataTransfer.setData(DRAG_INDEX, `${i}`);
  e.dataTransfer.setData(DRAG_HEIGHT, `${h}`);
  el.style.marginTop = `-${h}px`;
  el.classList.add('dragging');
  el.before(fake(h));
  el.parentElement.scrollTop = scroll;
};
const dropElement = (q: Queue, e: DragEvent) => {
  e.preventDefault();
  const el = (e.target as HTMLElement).closest('.element');
  if (el === null)
    return;
  let i = Array.from(el.parentElement.children).findIndex(n => n.isSameNode(el));
  const o = +e.dataTransfer.getData(DRAG_INDEX);
  if (i === -1 || i === o)
    return;
  el.parentElement.querySelector('.fake')?.remove();
  if (i > o) i--;
  const elem = q.move(o, i);
  elem.classList.remove('dragging');
  elem.style.marginTop = '';
};
const dragOverElement = (e: DragEvent) => {
  e.preventDefault();
  const el = (e.target as HTMLElement).closest('.element');
  if (el === null || el.classList.contains('fake'))
    return;
  const f = el.parentElement.querySelector('.fake');
  const fi = f !== null ? Array.from(el.parentElement.children).findIndex(n => n.isSameNode(f)) : 0;
  f?.remove();
  const i = Array.from(el.parentElement.children).findIndex(n => n.isSameNode(el));
  const o = +e.dataTransfer.getData(DRAG_INDEX);
  if (i === -1 || i === o)
    return;
  const p = el.parentElement;
  const s = i < fi ? (i > 0 ? p.children[i - 1] : null) : p.children[i];
  const h = +e.dataTransfer.getData(DRAG_HEIGHT);
  const node = fake(h);
  if (s === null)
    p.firstChild.before(node);
  else
    s.after(node);
};
const dragElementEnd = (e: DragEvent) => {
  const el = e.target as HTMLElement;
  el.classList.remove('dragging');
  el.style.marginTop = '';
  el.parentElement.querySelector('.fake')?.remove();
};
const fake = (h: number) => {
  const node = document.createElement('div');
  node.className = 'element fake';
  node.style.height = `${h}px`;
  return node;
};

export function initDrag(this: Queue) {
  this.elementsEl.addEventListener('dragstart', dragElement);
  this.elementsEl.addEventListener('drop', dropElement.bind(null, this));
  this.elementsEl.addEventListener('dragenter', ev => ev.preventDefault()); // allow drop
  this.elementsEl.addEventListener('dragover', dragOverElement); // allow drop
  this.elementsEl.addEventListener('dragend', dragElementEnd);
}