export abstract class DOMArray<T> extends Array<T> {
    root: HTMLElement;

    constructor(root: HTMLElement, ...items: T[]) {
        super();
        Object.setPrototypeOf(this, DOMArray.prototype);
        this.root = root;
        if (items.length) this.splice2(0, 0, items);
    }

    splice2(start: number, count: number, elements?: T[], nodes?: HTMLElement[]): [T[], HTMLElement[]] {
        if (nodes !== undefined && nodes.length !== 0 && nodes.length !== elements.length)
            throw new Error('length mismatch');
        start = start < 0 ? this.length - start : start;
        start = start < 0 ? 0 : start > this.length ? this.length : start;
        const end = start + count > this.length ? this.length : start + count;
        let s = start > 0 ? this.root.children[start - 1] : null;
        const n = nodes === undefined || nodes.length === 0;
        const delel = [];
        for (let i = end - 1; i >= start; i--) {
            delel.push(this.root.children[i] as HTMLElement);
            this.root.children[i].remove();
        }
        for (let i = 0; i < elements?.length || 0; i++) {
            const node = n ? this.createNode(elements[i]) : nodes[i];
            s === null ? this.root.firstChild === null ? this.root.append(node) : this.root.firstChild.before(node) : s.after(node);
            s = node;
        }
        const del = Array.prototype.splice.call(this, start, count, ...(elements || [])) as T[];
        this.update();
        return [del, delel];
    }

    protected abstract createNode(element: T): HTMLElement;
    protected update() { }
}