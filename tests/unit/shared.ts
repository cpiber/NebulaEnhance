/// <reference path="../../src/types/global.d.ts"/>
import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Events, Message, clone, dot, getCookie, injectFunction, injectScript, isMobile, isVideoListPage, isVideoPage, mutation, norm, parseMaybeJSON, parseTypeObject, replyMessage, sendEventHandler, sendMessage } from '../../src/scripts/helpers/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('dot product operations', () => {
  test('fail on unequal length', () => {
    expect(dot([], [0])).toBe(false);
  });

  test('single item', () => {
    expect(dot([5], [4])).toBe(5 * 4);
  });

  test('multi-dimensional', () => {
    const a1 = [ 1,2,3 ];
    const a2 = [ 3,2,1 ];
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
    expect(norm([ 1, 2, 3 ])).toBeCloseTo(Math.sqrt(1 * 1 + 2 * 2 + 3 * 3));
  });
});

describe('array occurence', () => {
  test('empty with empty input', () => {
    expect([].occurence()).toEqual({ values: [], occurences: [] });
  });

  test('only one value', () => {
    expect([ 1, 1, 1 ].occurence()).toEqual({ values: [1], occurences: [3] });
  });

  test('only one value each', () => {
    expect([ 1, 2, 3 ].occurence()).toEqual({ values: [ 1, 2, 3 ], occurences: [ 1, 1, 1 ] });
  });

  test('interleaving values', () => {
    expect([ 3, 1, 2, 1, 3, 3, 2 ].occurence()).toEqual({ values: [ 1, 2, 3 ], occurences: [ 2, 2, 3 ] });
  });
});

describe('array equality', () => {
  test('different length', () => {
    expect([].equals([1])).toBe(false);
  });

  test('different items', () => {
    expect([1].equals([2])).toBe(false);
    expect([ 1,2,3 ].equals([ 2,1,3 ])).toBe(false);
  });

  test('same values', () => {
    expect([ 1, 2, 3 ].equals([ 1, 2, 3 ])).toBe(true);
  });
});

describe('number pad', () => {
  test('strange length', () => {
    expect((5).pad(-5)).toBe('5');
    expect((5).pad(0)).toBe('5');
  });

  test('shorter', () => {
    expect((5).pad(2)).toBe('05');
    expect((50).pad(5)).toBe('00050');
  });

  test('exact', () => {
    expect((5).pad(1)).toBe('5');
    expect((50).pad(2)).toBe('50');
  });

  test('longer', () => {
    expect((50).pad(1)).toBe('50');
  });
});

describe('other', () => {
  test('isMobile verifies via media query', () => {
    const w = window;
    (window as any) = window || {};
    const mock = jest.fn<any, any>().mockReturnValueOnce({ matches: true }).mockReturnValueOnce({ matches: false });
    window.matchMedia = mock;

    expect(isMobile()).toBe(true);
    expect(isMobile()).toBe(false);
    expect(mock).toBeCalledTimes(2);
    mock.mock.calls.forEach(c => {
      expect(c[0]).toMatch(/pointer/);
    });
    window = w;
  });

  test('clone returns equivalent object', () => {
    const obj = { some: 'data', with: { nested: { arrays: [{ }] } } };
    expect(clone(obj)).toEqual(obj);
  });

  test('mutation debounces calls', () => {
    jest.useFakeTimers();
    const mock = jest.fn();
    const m = mutation(mock);
    for (let i = 0; i < 10; i++)
      m();
    jest.runAllTimers();
    expect(mock).toBeCalledTimes(1);

    for (let i = 0; i < 10; i++)
      m();
    jest.runAllTimers();
    expect(mock).toBeCalledTimes(2);
  });
});

describe('page matchers', () => {
  let loc: Location;
  beforeAll(() => {
    loc = window.location;
    delete window.location;
    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(loc),
        pathname: {
          configurable: true,
          value: '',
          writable: true,
        },
      },
    ) as Location;
  });
  afterAll(() => {
    window.location = loc;
  });

  test('video page', () => {
    window.location.pathname = '/videos/test';
    expect(isVideoPage()).toBe(true);
    window.location.pathname = '/videos/t/';
    expect(isVideoPage()).toBe(true);

    window.location.pathname = '/videos';
    expect(isVideoPage()).toBe(false);
    window.location.pathname = '/videos/';
    expect(isVideoPage()).toBe(false);
    window.location.pathname = '/';
    expect(isVideoPage()).toBe(false);
  });

  test('video list page', () => {
    window.location.pathname = '/videos';
    expect(isVideoListPage()).toBe(true);
    window.location.pathname = '/videos/';
    expect(isVideoListPage()).toBe(true);
    window.location.pathname = '/myshows';
    expect(isVideoListPage()).toBe(true);
    window.location.pathname = '/';
    expect(isVideoListPage()).toBe(true);

    window.location.pathname = '/videos/test';
    expect(isVideoListPage()).toBe(false);
    window.location.pathname = '/myshows/test';
    expect(isVideoListPage()).toBe(false);
    window.location.pathname = '/test';
    expect(isVideoListPage()).toBe(false);
  });
});

describe('script injection', () => {
  test('injecting with file works', async () => {
    const { log } = console;
    console.log = jest.fn();
    const dom = new JSDOM('', { url: `file://${__dirname}/index.html`, runScripts: 'dangerously', resources: 'usable' });

    const wrapper = dom.window.document.head;
    await expect(injectScript('../fixtures/log.js', wrapper, null, null, dom.window as never as Window)).resolves.toBe(void 0);
    expect((console.log as jest.Mock).mock.calls.length).toBe(1);
    console.log = log;
  });

  test('injecting with string works', async () => {
    const { log } = console;
    console.log = jest.fn();
    const wrapper = document.body.appendChild(document.createElement('div'));
    await expect(injectScript(wrapper, 'console.log("test")')).resolves.toBe(void 0);
    expect((console.log as jest.Mock).mock.calls.length).toBe(1);
    console.log = log;
  });

  test('injecting with invalid file rejects', async () => {
    const err = console.error;
    console.error = jest.fn();
    const dom = new JSDOM('', { url: `file://${__dirname}/index.html`, runScripts: 'dangerously', resources: 'usable' });

    const wrapper = dom.window.document.head;
    await expect(injectScript('./__invalid__.js', wrapper, null, null, dom.window as never as Window)).rejects.not.toBeUndefined();
    console.error = err;
  });

  test('injecting with data works', async () => {
    const { log } = console;
    const mock = console.log = jest.fn();
    const dom = new JSDOM('', { url: `file://${__dirname}/index.html`, runScripts: 'dangerously', resources: 'usable' });

    const wrapper = dom.window.document.head;
    await expect(injectScript('../fixtures/waitForEvent.js', wrapper, 'test', 'data', dom.window as never as Window)).resolves.toBe(void 0);
    expect(mock).toBeCalledTimes(1);
    expect(mock).toHaveBeenCalledWith('data');
    console.log = log;
  });

  test('injecting function works with arguments', () => {
    const { log } = console;
    const mock = console.log = jest.fn();
    injectFunction(document.body, data => console.log(data), 'test-data');
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith('test-data');
    console.log = log;
  });
});

describe('message sending', () => {
  const mock = jest.fn();
  beforeAll(() => {
    window.addEventListener('message', mock);
  });
  afterAll(() => {
    window.removeEventListener('message', mock);
  });

  const t = (setup: () => void | Promise<void>, ...checks: ((e: MessageEvent) => void | Promise<void>)[]) => () => Promise.all([
    /* eslint-disable-next-line no-async-promise-executor */
    new Promise(async resolve => {
      let i = 0;
      mock.mockImplementation(async (e: MessageEvent) => {
        await checks[i++](e);
        if (i === checks.length)
          resolve(0);
      });
      expect(window.parent).toBe(window);
    }),
    setup(),
  ]);

  test('sending message without expecting answer resolves immediately', t(async () => {
    await expect(sendMessage(Message.QUEUE_NEXT, { type: 'bla', test: 'data' }, false, true)).resolves.toBe(undefined);
  }, (e: MessageEvent) => {
    expect(JSON.parse(e.data)).toEqual({ type: Message.QUEUE_NEXT, test: 'data' });
  }));

  test('sending message can receive data', t(async () => {
    await expect(sendMessage(Message.QUEUE_NEXT, { test: 'data1' }, true, true)).resolves.toBe('ret');
  }, (e: MessageEvent) => {
    const d = JSON.parse(e.data);
    expect(d.test).toBe('data1');
    sendMessage(d.name, { res: 'ret' }, false);
  }, (e: MessageEvent) => {
    expect(JSON.parse(e.data).res).toBe('ret'); // from sendMessage reply
  }));

  test('sending message can receive errors', t(async () => {
    await expect(sendMessage(Message.QUEUE_NEXT, { test: 'data2' }, true, true)).rejects.toEqual({ error: 'err' });
  }, (e: MessageEvent) => {
    const d = JSON.parse(e.data);
    expect(d.test).toBe('data2');
    sendMessage(d.name, { err: { error: 'err' } }, false);
  }, (e: MessageEvent) => {
    expect(JSON.parse(e.data).err).toEqual({ error: 'err' }); // from sendMessage reply
  }));

  test('sending message with wrong name does not resolve promise', t(async () => {
    await expect(sendMessage(Message.QUEUE_NEXT, { test: 'given' }, true, true)).resolves.toBe('actual');
  }, (e: MessageEvent) => {
    const d = JSON.parse(e.data);
    expect(d.test).toBe('given');
    sendMessage(Message.QUEUE_PREV, { use: d.name, res: { something: 'wrong' } }, false);
  }, (e: MessageEvent) => {
    const d = JSON.parse(e.data);
    expect(d.res).toEqual({ something: 'wrong' });
    sendMessage(d.use, { res: 'actual' }, false);
  }, (e: MessageEvent) => {
    expect(JSON.parse(e.data).res).toBe('actual');
  }));

  test('accepts string-like data', t(async () => {
    await expect(sendMessage(Message.QUEUE_NEXT, { hi: 'there' }, true, true)).resolves.toBe(undefined);
  }, (e: MessageEvent) => {
    const d = JSON.parse(e.data);
    expect(d.hi).toBe('there');
    window.postMessage(d.name, '*');
  }, (e: MessageEvent) => {
    expect(e.data).toContain('enhancer-message-');
  }));
});

describe('message event listeners', () => {
  const mock = jest.fn<any, any>();
  beforeAll(() => {
    window.addEventListener('message', mock);
  });
  afterAll(() => {
    window.removeEventListener('message', mock);
  });

  test('sends a register event', () => new Promise((resolve) => {
    mock.mockImplementation((ev) => {
      expect(JSON.parse(ev.data).event).toBe(Events.QUEUE_CHANGE);
      resolve(0);
    });
    sendEventHandler(Events.QUEUE_CHANGE, () => { /* */ }, true);
  }));

  test('runs listeners', async () => {
    let name: string;
    const cb = jest.fn();

    await new Promise((resolve) => {
      mock.mockImplementation(ev => {
        ({ name } = JSON.parse(ev.data));
        resolve(0);
      });
      sendEventHandler(Events.QUEUE_CHANGE, cb, true);
    });
    mock.mockRestore(); // we post below, don't make problems

    for (let i = 0; i < 4; i++) {
      await expect(new Promise((resolve) => {
        cb.mockImplementationOnce(resolve);
        window.postMessage({ type: name, res: i }, '*');
      })).resolves.toBe(i);
      expect(cb).toBeCalledTimes(i + 1);
    }
  });
});

describe('message reply', () => {
  const mock = jest.fn();
  beforeAll(() => {
    window.addEventListener('message', mock);
  });
  afterAll(() => {
    window.removeEventListener('message', mock);
  });

  const reply = (data: any, origin = '*') => (ev: MessageEvent) => {
    const msg = parseTypeObject<{ type: string, name: string }>(ev.data);
    // need to manually define these, because jsdom doesn't implement this behaviour
    const e = new MessageEvent('message', { origin, source: window });
    replyMessage(e, msg.name, data);
  };

  test('reply sends to name', async () => {
    mock.mockImplementationOnce(reply('data'));
    await expect(sendMessage(Message.QUEUE_NEXT, null, true, true)).resolves.toBe('data');
  });
});

describe('cookie', () => {
  test('get cookie', () => {
    document.cookie = 'test=1';
    expect(getCookie('test')).toBe('1');
  });

  test('get cookie from multiple', () => {
    document.cookie = 'test=1';
    document.cookie = 'test1=2';
    document.cookie = 'test2=3';
    expect(getCookie('test')).toBe('1');
    expect(getCookie('test1')).toBe('2');
    expect(getCookie('test2')).toBe('3');
  });

  test('get cookie with expiry', () => {
    document.cookie = 'test=1; expires=1y';
    expect(getCookie('test')).toBe('1');
  });

  test('invalid cookie', () => {
    expect(getCookie('invalid')).toBeNull();
  });
});

describe('parsing', () => {
  test('JSON', () => {
    expect(parseMaybeJSON('test')).toBe('test');
    expect(parseMaybeJSON('1')).toBe(1);
    expect(parseMaybeJSON('[]')).toEqual([]);
    expect(parseMaybeJSON('["test"]')).toEqual(['test']);
    expect(parseMaybeJSON('{"test":1}')).toEqual({ test: 1 });
    expect(parseMaybeJSON('{"test":1')).toEqual('{"test":1');
  });

  test('type-object', () => {
    expect(parseTypeObject('test')).toEqual({ type: 'test' });
    expect(parseTypeObject('{"type":"t"}')).toEqual({ type: 't' });
    expect(() => parseTypeObject('{"type":1}')).toThrow(/not convertible/);
    expect(() => parseTypeObject('[]')).toThrow(/not convertible/);
    expect(parseTypeObject('{"type":1}', true)).toBeNull();
    expect(parseTypeObject('[]', true)).toBeNull();
  });
});
