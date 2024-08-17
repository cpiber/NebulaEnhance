import { jest } from '@jest/globals';
import fetch from 'node-fetch';
import type { Video } from '../../src/scripts/background';
import '../../src/scripts/helpers/shared/prototype';

global.fetch = fetch as unknown as typeof global.fetch;

const { creatorHasNebulaVideo, loadNebulaChannelVideos, existsNebulaVideo, loadNebulaSearchVideos } = await import('../../src/scripts/background/nebula');

describe('loading nebula videos', () => {
  const consoleError = console.error;
  const consoleDebug = console.debug;
  beforeEach(() => {
    console.error = consoleError;
    console.debug = consoleDebug;
  });

  test('non-existant channel', async () => {
    console.debug = jest.fn();
    console.error = jest.fn();
    await expect(creatorHasNebulaVideo('', '', 50)).rejects.toBeDefined();
    await expect(creatorHasNebulaVideo('UU', '', 50)).rejects.toBeDefined();
    await expect(creatorHasNebulaVideo('', 'test', 50)).rejects.toBeDefined();
    await expect(creatorHasNebulaVideo('UU', 'test', 50)).rejects.toBeDefined();
  });

  jest.setTimeout(10000);
  test('Half as Interesting', async () => {
    console.debug = jest.fn();
    console.error = jest.fn();
    await expect(loadNebulaChannelVideos('hai', 0)).resolves.toHaveLength(0);
    await expect(loadNebulaChannelVideos('hai', 50)).resolves.toHaveLength(50);
    await expect(loadNebulaChannelVideos('hai', 100)).resolves.toHaveLength(100);
    const vid = (await loadNebulaChannelVideos('hai', 1))[0] as Video;
    await expect(creatorHasNebulaVideo('hai', vid.title, 50)).resolves.toEqual({ confidence: 1, video: vid.videoId });
    await expect(creatorHasNebulaVideo('hai', vid.title + ' asdf', 50)).resolves.toMatchObject({ video: vid.videoId });
    await expect(creatorHasNebulaVideo('hai', vid.title, 100)).resolves.toEqual({ confidence: 1, video: vid.videoId });

    // from cache
    const fetchMock = jest.fn<any>();
    global.fetch = fetchMock;
    await expect(creatorHasNebulaVideo('hai', vid.title, 50)).resolves.toEqual({ confidence: 1, video: vid.videoId });
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(loadNebulaChannelVideos('hai', 100)).resolves.toHaveLength(100);
    expect(fetchMock).not.toHaveBeenCalled();
    global.fetch = fetch as unknown as typeof global.fetch;
  });

  test('search', async () => {
    console.debug = jest.fn();
    console.error = jest.fn();
    await expect(loadNebulaSearchVideos('test', 0)).resolves.toHaveLength(0);
    await expect(loadNebulaSearchVideos('test', 50)).resolves.toHaveLength(50);
    await expect(loadNebulaSearchVideos('test', 100)).resolves.toHaveLength(100);
    const vid = (await loadNebulaSearchVideos('test', 1))[0] as Video;
    await expect(existsNebulaVideo(vid.title, 50)).resolves.toEqual({ confidence: 1, video: vid.videoId });
    await expect(existsNebulaVideo(vid.title, 100)).resolves.toEqual({ confidence: 1, video: vid.videoId });

    // from cache
    const fetchMock = jest.fn<any>();
    global.fetch = fetchMock;
    await expect(existsNebulaVideo(vid.title, 50)).resolves.toEqual({ confidence: 1, video: vid.videoId });
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(loadNebulaSearchVideos('test', 100)).resolves.toHaveLength(100);
    expect(fetchMock).not.toHaveBeenCalled();
    global.fetch = fetch as unknown as typeof global.fetch;
  });
});
