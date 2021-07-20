/// <reference path="../../src/types/global.d.ts"/>
import { JSDOM } from 'jsdom';
import { dot, injectScript, isMobile, norm } from '../../src/scripts/helpers/shared';

describe('dot product operations', () => {
  test('fail on unequal length', () => {
    expect(dot([], [0])).toBe(false);
  });

  test('single item', () => {
    expect(dot([5], [4])).toBe(5 * 4);
  });

  test('multi-dimensional', () => {
    const a1 = [1,2,3];
    const a2 = [3,2,1];
    const d = a1[0] * a2[0] + a1[1] * a2[1] + a1[2] * a2[2];
    expect(dot(a1, a2)).toBeCloseTo(d);
  });
});

describe('norm (vector square-length)', () => {
  test('empty array', () => {
    expect(norm([])).toBe(0);
  });

  test('1 value', () => {
    expect(norm([7])).toBe(7);
  });

  test('multi-dimensional', () => {
    expect(norm([1, 2, 3])).toBeCloseTo(Math.sqrt(1 * 1 + 2 * 2 + 3 * 3));
  });
});

describe('array occurence', () => {
  test('empty with empty input', () => {
    expect([].occurence()).toEqual({ values: [], occurences: [] });
  });

  test('only one value', () => {
    expect([1, 1, 1].occurence()).toEqual({ values: [1], occurences: [3] });
  });

  test('only one value each', () => {
    expect([1, 2, 3].occurence()).toEqual({ values: [1, 2, 3], occurences: [1, 1, 1] });
  });

  test('interleaving values', () => {
    expect([3, 1, 2, 1, 3, 3, 2].occurence()).toEqual({ values: [1, 2, 3], occurences: [2, 2, 3] });
  });
});

describe('array equality', () => {
  test('different length', () => {
    expect([].equals([1])).toBe(false);
  });

  test('different items', () => {
    expect([1].equals([2])).toBe(false);
    expect([1,2,3].equals([2,1,3])).toBe(false);
  });

  test('same values', () => {
    expect([1, 2, 3].equals([1, 2, 3])).toBe(true);
  });
});

describe('number pad', () => {
  test('strange length', () => {
    expect((5).pad(-5)).toBe("5");
    expect((5).pad(0)).toBe("5");
  });

  test('shorter', () => {
    expect((5).pad(2)).toBe("05");
    expect((50).pad(5)).toBe("00050");
  });

  test('exact', () => {
    expect((5).pad(1)).toBe("5");
    expect((50).pad(2)).toBe("50");
  });

  test('longer', () => {
    expect((50).pad(1)).toBe("50");
  });
});

describe('other', () => {
  test('isMobile verifies via media query', () => {
    const w = window;
    (window as any) = window || {};
    const mock = jest.fn().mockReturnValueOnce({ matches: true }).mockReturnValueOnce({ matches: false });
    window.matchMedia = mock;

    expect(isMobile()).toBe(true);
    expect(isMobile()).toBe(false);
    expect(mock.mock.calls.length).toBe(2);
    mock.mock.calls.forEach(c => {
      expect(c[0]).toMatch(/pointer/);
    });
    window = w;
  });

  test('injecting with file works', async () => {
    const log = console.log;
    console.log = jest.fn();
    const dom = new JSDOM(``, { url: `file://${__dirname}/index.html`, runScripts: "dangerously", resources: "usable" });
    
    const wrapper = dom.window.document.head;
    await expect(injectScript('../fixtures/log.js', wrapper, null, null, dom.window as never as Window)).resolves.toBe(void 0);
    expect((console.log as jest.Mock).mock.calls.length).toBe(1);
    console.log = log;
  });

  test('injecting with string works', async () => {
    const log = console.log;
    console.log = jest.fn();
    const wrapper = document.body.appendChild(document.createElement('div'));
    await expect(injectScript(wrapper, 'console.log("test")')).resolves.toBe(void 0);
    expect((console.log as jest.Mock).mock.calls.length).toBe(1);
    console.log = log;
  });

  test('injecting with invalid file rejects', async () => {
    const err = console.error;
    console.error = jest.fn();
    const dom = new JSDOM(``, { url: `file://${__dirname}/index.html`, runScripts: "dangerously", resources: "usable" });
    
    const wrapper = dom.window.document.head;
    await expect(injectScript('./__invalid__.js', wrapper, null, null, dom.window as never as Window)).rejects.not.toBeUndefined();
    console.error = err;
  });

  test('injecting with data works', async () => {
    const log = console.log;
    const mock = console.log = jest.fn();
    const dom = new JSDOM(``, { url: `file://${__dirname}/index.html`, runScripts: "dangerously", resources: "usable" });
    
    const wrapper = dom.window.document.head;
    await expect(injectScript('../fixtures/waitForEvent.js', wrapper, 'test', 'data', dom.window as never as Window)).resolves.toBe(void 0);
    expect(mock.mock.calls.length).toBe(1);
    expect(mock.mock.calls[0][0]).toBe('data');
    console.log = log;
  });
});
