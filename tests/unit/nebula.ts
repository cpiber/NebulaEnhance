import fetch, { Response } from 'node-fetch';
import type { Video } from '../../src/scripts/background';
import { NEBULA_AUTH_KEY } from '../../src/scripts/helpers/shared';

global.fetch = fetch as unknown as typeof global.fetch;

jest.mock('../../src/scripts/helpers/api/store', (): typeof import('../../src/scripts/helpers/api/store') & { __esModule: true } => {
  const orig = jest.requireActual('../../src/scripts/helpers/api/store') as typeof import('../../src/scripts/helpers/api/store');

  return {
    __esModule: true,
    ...orig,
    refreshToken: jest.fn(orig.refreshToken),
  };
});
// need to do this here with a require, because rollup will hoist all imports, and we don't have a plugin to hoist jest.mock (like babel-plugin-jest-hoist)
const { opt, refreshToken } = require('../../src/scripts/helpers/api/store') as typeof import('../../src/scripts/helpers/api/store');
const { getVideo } = require('../../src/scripts/helpers/api') as typeof import('../../src/scripts/helpers/api');
const { creatorHasNebulaVideo, loadNebulaVideos } = require('../../src/scripts/background') as typeof import('../../src/scripts/background');
const refMock = refreshToken as jest.MockedFunction<typeof refreshToken>;

describe('loading nebula videos', () => {
  const consoleError = console.error;
  const consoleDebug = console.debug;
  beforeEach(() => {
    console.error = consoleError;
    console.debug = consoleDebug;
  });

  test('non-existant channel', async () => {
    console.error = jest.fn();
    await expect(creatorHasNebulaVideo('', '', 10)).rejects.toBeDefined();
    await expect(creatorHasNebulaVideo('UU', '', 10)).rejects.toBeDefined();
    await expect(creatorHasNebulaVideo('', 'test', 10)).rejects.toBeDefined();
    await expect(creatorHasNebulaVideo('UU', 'test', 10)).rejects.toBeDefined();
  });

  jest.setTimeout(10000);
  test('Half as Interesting', async () => {
    console.debug = jest.fn();
    console.error = jest.fn();
    await expect(loadNebulaVideos('hai', 0, '')).resolves.toHaveLength(0);
    await expect(loadNebulaVideos('hai', 10, '')).resolves.toHaveLength(10);
    await expect(loadNebulaVideos('hai', 20, '')).resolves.toHaveLength(20);
    const vid = (await loadNebulaVideos('hai', 1, ''))[0] as Video;
    await expect(creatorHasNebulaVideo('hai', vid.title, 10)).resolves.toEqual({ confidence: 1, video: vid.videoId });
    await expect(creatorHasNebulaVideo('hai', vid.title + ' asdf', 10)).resolves.toMatchObject({ video: vid.videoId });
    await expect(creatorHasNebulaVideo('hai', vid.title, 20)).resolves.toEqual({ confidence: 1, video: vid.videoId });

    // from cache
    const fetchMock = jest.fn();
    global.fetch = fetchMock;
    await expect(creatorHasNebulaVideo('hai', vid.title, 10)).resolves.toEqual({ confidence: 1, video: vid.videoId });
    expect(fetchMock).not.toBeCalled();
    await expect(loadNebulaVideos('hai', 20, '')).resolves.toHaveLength(20);
    expect(fetchMock).not.toBeCalled();
    global.fetch = fetch as unknown as typeof global.fetch;
  });
});

describe('api', () => {
  const fetchMock = jest.fn();

  beforeAll(() => {
    global.fetch = fetchMock;
  });

  afterEach(() => {
    document.cookie = `${NEBULA_AUTH_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`; // remove auth cookie
    opt.auth = null;
    fetchMock.mockClear();
    refMock.mockClear();
  });

  const consoleError = console.error;
  const consoleDebug = console.debug;
  beforeEach(() => {
    console.error = consoleError;
    console.debug = consoleDebug;
  });

  afterAll(() => {
    global.fetch = fetch as unknown as typeof global.fetch;
  });

  const genTokenResponse = () => Promise.resolve(new Response(JSON.stringify({ token: Math.random().toString(16).substr(2) })));

  test('no token', async () => {
    fetchMock.mockImplementationOnce(genTokenResponse);

    console.error = jest.fn();
    const token = await refreshToken();
    expect(fetchMock).toHaveBeenCalled();
    expect(token).toBeTruthy();
    expect(opt.auth).toBe(token);
  });

  test('token from cookie', async () => {
    fetchMock.mockImplementationOnce((_, init) => {
      expect(init.headers.Authorization).toContain('test');
      return genTokenResponse();
    });

    document.cookie = `${NEBULA_AUTH_KEY}=${JSON.stringify({ apiToken: 'test' })}`;
    const token = await refreshToken();
    expect(fetchMock).toHaveBeenCalled();
    expect(token).toBeTruthy();
    expect(opt.auth).toBe(token);
  });

  test('request refreshes token automatically', async () => {
    fetchMock.mockImplementationOnce(genTokenResponse)
      .mockReturnValueOnce(Promise.resolve(new Response('{}')));

    console.error = jest.fn();
    await getVideo('test');
    expect(refMock).toHaveBeenCalled();
  });

  test('request refreshes after token expired', async () => {
    fetchMock.mockImplementationOnce(genTokenResponse)
      .mockReturnValueOnce(Promise.resolve(new Response(JSON.stringify({ detail: 'Signature has expired' }))))
      .mockImplementationOnce(genTokenResponse)
      .mockReturnValueOnce(Promise.resolve(new Response('{}')));

    console.error = jest.fn();
    await getVideo('test');
    expect(refMock).toHaveBeenCalledTimes(2);
  });
});
