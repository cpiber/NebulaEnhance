import iconDelete from "../../icons/delete.svg";
import iconPlay from "../../icons/play.svg";
import { callback as ArrayCallback, DOMArray } from "./DOMArray";

export type video = {
  length: string,
  thumbnail: string,
  title: string,
  creator: string,
};

export type Store = { [key: string]: video };

export class Queue extends DOMArray<string> {
  store: Store;

  constructor(root: HTMLElement, cb: ArrayCallback<string>, store: Store) {
    super(root, cb);
    Object.setPrototypeOf(this, Queue.prototype);
    this.store = store;
  }

  createNode(name: string): HTMLElement {
    const n = document.createElement('div');
    n.className = 'element';
    n.innerHTML = `
      <div class="drag">&#x2630;</div>
      <div class="thumb">
        <img src="${this.store[name].thumbnail}" draggable="false" />
        <div class="play">${iconPlay}</div>
      </div>
      <div class="data">
        <span class="title"></span>
        <span class="creator"></span>
      </div>
      <div class="remove"><span class="r">${iconDelete}</span></div>
    `;
    n.draggable = true;
    n.querySelector('.title').textContent = this.store[name].title;
    n.querySelector('.creator').textContent = `${this.store[name].creator} • ${this.store[name].length}`;
    return n;
  }
}