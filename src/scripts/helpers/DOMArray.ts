export type callback<T> = (this: DOMArray<T>) => void;

export abstract class DOMArray<T> extends Array<T> {
  root: HTMLElement;
  update: callback<T>;

  constructor(root: HTMLElement, cb?: callback<T>) {
    super();
    Object.setPrototypeOf(this, DOMArray.prototype);
    this.root = root;
    this.update = (cb ? cb : function () { /* placeholder */ }).bind(this);
  }

  splice2(start: number, count: number, elements?: T[], nodes?: HTMLElement[]): [T[], HTMLElement[]] {
    if (nodes !== undefined && nodes.length !== 0 && nodes.length !== elements.length)
      throw new Error('length mismatch');
    if (nodes !== undefined && nodes.findIndex(e => !e) !== -1)
      throw new Error('no elements must be null');
    start = start < 0 ? this.length + start : start;
    start = Math.min(Math.max(start, 0), this.length);
    const end = Math.min(start + count, this.length);
    let s = start > 0 ? this.root.children[start - 1] : null;
    const n = nodes === undefined || nodes.length === 0;
    const delel = [];
    for (let i = end - 1; i >= start; i--) {
      delel.push(this.root.children[i] as HTMLElement);
      this.root.children[i].remove();
    }
    for (let i = 0; i < elements?.length || 0; i++) {
      const node = n ? this.createNode(elements[i]) : nodes[i];
      if (s === null)
        this.root.firstChild === null ? this.root.append(node) : this.root.firstChild.before(node);
      else s.after(node);
      s = node;
    }
    const del = this.splice(start, count, ...(elements || []));
    this.update();
    return [ del, delel ];
  }

  reverse2() {
    if (this.root.children.length <= 1) return this;
    const n = this.root.children.length - 1;
    for (let i = n - 1; i >= 0; --i) {
      const e = this.root.children[i];
      this.root.children[i].remove();
      this.root.append(e);
    }
    this.reverse();
    this.update();
    return this;
  }

  protected abstract createNode(element: T): HTMLElement;
}