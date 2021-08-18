import fetch from 'node-fetch';
import { creatorHasVideo, loadCreators, loadVideos, matchVideoConfidence, Video } from '../../src/scripts/helpers/youtube';

global.fetch = fetch as unknown as typeof global.fetch;

test('loading creators works', async () => {
  const creators = await loadCreators();
  expect(creators.length).not.toBe(0);
});

describe('loading youtube videos', () => {
  const consoleError = console.error;
  const consoleDebug = console.debug;
  beforeEach(() => {
    console.error = consoleError;
    console.debug = consoleDebug;
  });

  test('non-existant channel', async () => {
    console.error = jest.fn();
    await expect(creatorHasVideo('', '', 50)).rejects.toBeDefined();
    await expect(creatorHasVideo('UU', '', 50)).rejects.toBeDefined();
    await expect(creatorHasVideo('', 'test', 50)).rejects.toBeDefined();
    await expect(creatorHasVideo('UU', 'test', 50)).rejects.toBeDefined();
  });

  test('Half as Interesting', async () => {
    console.debug = jest.fn();
    await expect(loadVideos('UUuCkxoKLYO_EQ2GeFtbM_bw', '', 50)).resolves.toHaveLength(50);
    await expect(loadVideos('UUuCkxoKLYO_EQ2GeFtbM_bw', '', 100)).resolves.toHaveLength(100);
    await expect(loadVideos('UUuCkxoKLYO_EQ2GeFtbM_bw', '', 0)).rejects.toEqual(new Error('Invalid API response'));
    const vid = (await loadVideos('UUuCkxoKLYO_EQ2GeFtbM_bw', '', 1))[0] as Video;
    await expect(creatorHasVideo('UUuCkxoKLYO_EQ2GeFtbM_bw', vid.title, 50)).resolves.toEqual({ confidence: 1, video: vid.videoId });
    await expect(creatorHasVideo('UUuCkxoKLYO_EQ2GeFtbM_bw', vid.title + ' asdf', 50)).resolves.toMatchObject({ video: vid.videoId });

    // from cache
    const fetchMock = jest.fn();
    global.fetch = fetchMock;
    await expect(creatorHasVideo('UUuCkxoKLYO_EQ2GeFtbM_bw', vid.title, 50)).resolves.toEqual({ confidence: 1, video: vid.videoId });
    global.fetch = fetch as unknown as typeof global.fetch;
    expect(fetchMock.mock.calls.length).toBe(0);
  });

  test('good confidence', () => {
    console.debug = jest.fn();
    const match1 = matchVideoConfidence([
      { title: 'a title that can be matched quite well', videoId: 'good' },
      { title: 'this one shouldn\'t be matched actually', videoId: 'bad' },
    ], 'some test title that can hopefully be matched quite well');
    expect(match1.confidence).toBeGreaterThan(0.25);
    expect(match1.video).toBe('good');
    const match2 = matchVideoConfidence([
      { title: 'a test title that can be matched well', videoId: 'good' },
      { title: 'this one shouldn\'t be matched actually', videoId: 'bad' },
    ], 'some test title that can hopefully be matched quite well');
    expect(match2.confidence).toBeGreaterThan(0.25);
    expect(match2.video).toBe('good');
  });

  test('bad confidence', () => {
    console.debug = jest.fn();
    expect(() => matchVideoConfidence([
      { title: 'a title that can be matched quite well', videoId: 'bad1' },
      { title: 'this one shouldn\'t be matched actually', videoId: 'bad2' },
    ], 'some test title, a really bad one')).toThrow(/confidence/);
    expect(() => matchVideoConfidence([
      { title: 'a test title', videoId: 'good1' },
      { title: 'is a test title', videoId: 'good2' },
    ], 'test title')).toThrow(/confidence/);
    expect(() => matchVideoConfidence([
      { title: 'this one shouldn\'t be matched really', videoId: 'bad2' },
    ], 'test title')).toThrow(/data/);
    expect(() => matchVideoConfidence([
      { title: 'this one shouldn\'t be matched because of low similarity', videoId: 'bad2' },
    ], 'test title with just a single matched word')).toThrow(/data/);
  });

  test('no videos', () => {
    expect(() => matchVideoConfidence([], '')).toThrow();
    expect(matchVideoConfidence('test', '')).toEqual({ confidence: 1, video: 'test' });
  });
});