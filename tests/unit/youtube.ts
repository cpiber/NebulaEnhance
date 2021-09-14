import fetch from 'node-fetch';
import { Video, creatorHasYTVideo, loadYTVideos } from '../../src/scripts/background';

global.fetch = fetch as unknown as typeof global.fetch;

describe('loading youtube videos', () => {
  const consoleError = console.error;
  const consoleDebug = console.debug;
  beforeEach(() => {
    console.error = consoleError;
    console.debug = consoleDebug;
  });

  test('non-existant channel', async () => {
    console.error = jest.fn();
    await expect(creatorHasYTVideo('', '', 50)).rejects.toBeDefined();
    await expect(creatorHasYTVideo('UU', '', 50)).rejects.toBeDefined();
    await expect(creatorHasYTVideo('', 'test', 50)).rejects.toBeDefined();
    await expect(creatorHasYTVideo('UU', 'test', 50)).rejects.toBeDefined();
  });

  test('Half as Interesting', async () => {
    console.debug = jest.fn();
    await expect(loadYTVideos('UUuCkxoKLYO_EQ2GeFtbM_bw', '', 0)).rejects.toEqual(new Error('Invalid API response'));
    await expect(loadYTVideos('UUuCkxoKLYO_EQ2GeFtbM_bw', '', 50)).resolves.toHaveLength(50);
    await expect(loadYTVideos('UUuCkxoKLYO_EQ2GeFtbM_bw', '', 100)).resolves.toHaveLength(100);
    const vid = (await loadYTVideos('UUuCkxoKLYO_EQ2GeFtbM_bw', '', 1))[0] as Video;
    await expect(creatorHasYTVideo('UUuCkxoKLYO_EQ2GeFtbM_bw', vid.title, 50)).resolves.toEqual({ confidence: 1, video: vid.videoId });
    await expect(creatorHasYTVideo('UUuCkxoKLYO_EQ2GeFtbM_bw', vid.title + ' asdf', 50)).resolves.toMatchObject({ video: vid.videoId });
    await expect(creatorHasYTVideo('UUuCkxoKLYO_EQ2GeFtbM_bw', vid.title, 150)).resolves.toEqual({ confidence: 1, video: vid.videoId });

    // from cache
    const fetchMock = jest.fn();
    global.fetch = fetchMock;
    await expect(creatorHasYTVideo('UUuCkxoKLYO_EQ2GeFtbM_bw', vid.title, 50)).resolves.toEqual({ confidence: 1, video: vid.videoId });
    expect(fetchMock).not.toBeCalled();
    await expect(loadYTVideos('UUuCkxoKLYO_EQ2GeFtbM_bw', '', 100)).resolves.toHaveLength(100);
    expect(fetchMock).not.toBeCalled();
    global.fetch = fetch as unknown as typeof global.fetch;
  });
});