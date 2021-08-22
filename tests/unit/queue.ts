import { Store, VideoArray } from '../../src/scripts/helpers/VideoQueue';
import { DOMArray, callback } from '../../src/scripts/helpers/DOMArray';

class TestArray extends DOMArray<string> {
  constructor(root: HTMLElement, cb?: callback<string>, ...items: string[]) {
    super(root, cb);
    Object.setPrototypeOf(this, TestArray.prototype);
    if (items.length) this.splice2(0, 0, items);
  }

  createNode(element: string): HTMLElement {
    return TestArray.toElement(element);
  }

  static toElement(element: string) {
    const e = document.createElement('span');
    e.textContent = element;
    return e;
  }

  static toElements(elements: string[]) {
    return elements.map(this.toElement);
  }
}
const mapAlternative = (element: string) => {
  const e = document.createElement('span');
  e.textContent = 'gg' + element;
  return e;
};

describe('DOMArray', () => {
  let root: HTMLElement;
  let cb: jest.Mock;
  beforeEach(() => {
    root = document.createElement('div');
    cb = jest.fn();
  });

  test('callback is called', () => {
    const arr = new TestArray(root, cb);
    arr.splice2(0, 0);
    arr.splice2(0, 0);
    expect(cb.mock.calls.length).toBe(2);
  });

  test('constructing correctly inserts elements', () => {
    const items = [ '1', '2', '3' ];
    const arr = new TestArray(root, null, ...items);
    expect([...arr]).toEqual(items);
    expect(Array.from(root.children)).toEqual(TestArray.toElements(items));
  });

  test('splicing in/out objects works and calls cb', () => {
    const arr = new TestArray(root, cb);
    const items = [ '1', '2', '3' ];
    arr.splice2(0, 0, items);
    expect(cb.mock.calls.length).toBe(1);
    expect([...arr]).toEqual(items);
    arr.splice2(1, 1);
    items.splice(1, 1);
    expect(cb.mock.calls.length).toBe(2);
    expect([...arr]).toEqual(items);
    arr.splice2(1, 1, [ '4', '5', '6' ]);
    items.splice(1, 1, '4', '5', '6');
    expect(cb.mock.calls.length).toBe(3);
    expect([...arr]).toEqual(items);
    expect(Array.from(root.children)).toEqual(TestArray.toElements(items));
  });

  test('splicing with given elements works', () => {
    const arr = new TestArray(root);
    const items = [ '1', '2', '3' ];
    const els = items.map(mapAlternative);
    arr.splice2(0, 0, items, els);
    expect([...arr]).toEqual(items);
    expect(Array.from(root.children)).toEqual(els);
    expect(() => arr.splice2(0, 0, ['1'], [null])).toThrow();
    expect(() => arr.splice2(0, 0, ['1'], [ document.createElement('span'), document.createElement('span') ])).toThrow();
  });

  test('putting elements in beginning works', () => {
    const items = ['4'];
    const items2 = [ '1', '2', '3' ];
    const arr = new TestArray(root, undefined, ...items);
    arr.splice2(0, 0, items2);
    expect([...arr]).toEqual([ ...items2, ...items ]);
  });

  test('slicing negative works', () => {
    const items = [ '1', '2', '3' ];
    const arr = new TestArray(root, cb, ...items);
    expect(cb.mock.calls.length).toBe(1);
    expect([...arr]).toEqual(items);
    arr.splice2(-1, 1);
    items.splice(-1, 1);
    expect(cb.mock.calls.length).toBe(2);
    expect([...arr]).toEqual(items);
    arr.splice2(-5, items.length);
    items.splice(-5, items.length);
    expect([...arr]).toEqual(items);
  });

  test('reversing works', () => {
    const arr = new TestArray(root);
    const items = [ '1', '2', '3' ];
    const els = items.map(mapAlternative);
    arr.splice2(0, 0, items, els);
    expect(arr.length).toBe(items.length);
    arr.reverse2();
    expect(arr.length).toBe(items.length);
    expect([...arr]).toEqual(items.reverse());
    expect(Array.from(root.children)).toEqual(els.reverse());
    arr.splice2(1, arr.length);
    expect(arr.length).toBe(1);
    expect([...arr]).toEqual([items[0]]);
    expect(Array.from(root.children)).toEqual([els[0]]);
    arr.reverse2();
    expect(arr.length).toBe(1);
    expect([...arr]).toEqual([items[0]]);
    expect(Array.from(root.children)).toEqual([els[0]]);
    arr.splice2(0, 1);
    expect(arr.length).toBe(0);
    expect(root.children.length).toBe(0);
    arr.reverse2();
    expect(arr.length).toBe(0);
    expect(root.children.length).toBe(0);
  });
});

describe('VideoQueue', () => {
  let root: HTMLElement;
  let store: Store;
  let queue: VideoArray;
  beforeEach(() => {
    root = document.createElement('div');
    store = {};
    queue = new VideoArray(root, null, store);
  });

  test('elements include necessary elements', () => {
    store['test'] = { length: 'length', creator: 'creator', thumbnail: 'http://thumbnail/', title: 'title' };
    queue.splice2(0, 0, ['test']);
    expect([...queue]).toEqual(['test']);
    expect(root.children.length).toBe(1);
    expect(root.children[0].querySelector('img').src).toBe('http://thumbnail/');
    expect(root.children[0].querySelector('.title').textContent).toBe('title');
    expect(root.children[0].querySelector('.creator').textContent).toContain('creator');
    expect(root.children[0].querySelector('.creator').textContent).toContain('length');
  });
});
