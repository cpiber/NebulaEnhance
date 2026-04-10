import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import fetch from 'node-fetch';
import { matchVideoConfidence } from '../../src/scripts/background/ifidf';
import { getChannels } from '../../src/scripts/helpers/api';
import '../../src/scripts/helpers/shared/prototype';
import { getInformation as loadCreators } from '../../src/scripts/page/offscreen';

global.fetch = fetch as unknown as typeof global.fetch;

test('loading creators works', async () => {
  const creators = await loadCreators();
  expect(creators.length).not.toBe(0);
});

test('loaded creators cover all channels', async () => {
  const channels = await getChannels();
  const creators = await loadCreators();
  const excluded = [ 'apple-talk', 'avoidclimatechange', 'nextlevelworldbuilding', 'dinnerplan', 'dex', 'edith', 'faithless', 'getaway', 'one-villainous-scene', 'one-x-cellent-scene', 'rng', 'scav', 'trussissues', 'theeditorial', 'layover', 'theprince', 'wtf', 'workingtitles' ];
  for (const channel of channels) {
    const match = creators.find(c => c.nebula === channel.slug || c.nebulaAlt === channel.slug);
    if (match) continue;
    if (excluded.includes(channel.slug)) continue;
    expect(channel.slug).toBeUndefined();
  }

  return; // only run manually
  let i = 0;
  for (const creator of creators) {
    if (!creator.uploads) continue;
    const url = new URL('https://youtube.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('playlistId', creator.uploads);
    url.searchParams.set('key', __YT_API_KEY__);
    url.searchParams.set('maxResults', '0');
    console.log('creator ', creator.name, ' (', creator.nebula, '): ');
    await expect(fetch(url).then(r => r.status)).resolves.toBe(200);
    if ((i++ % 20) === 0) await new Promise(resolve => setTimeout(resolve, 1000));
  }
}, 200_000);

describe('matching', () => {
  const consoleError = console.error;
  const consoleDebug = console.debug;
  beforeEach(() => {
    console.error = consoleError;
    console.debug = consoleDebug;
  });

  test('good confidence', () => {
    console.debug = jest.fn();
    const match1 = matchVideoConfidence({}, [
      { title: 'a title that can be matched quite well', videoId: 'good' },
      { title: 'this one shouldn\'t be matched actually', videoId: 'bad' },
    ], 'some test title that can hopefully be matched quite well');
    expect(match1.confidence).toBeGreaterThan(0.25);
    expect(match1.video).toBe('good');
    const match2 = matchVideoConfidence({}, [
      { title: 'a test title that can be matched well', videoId: 'good' },
      { title: 'this one shouldn\'t be matched actually', videoId: 'bad' },
    ], 'some test title that can hopefully be matched quite well');
    expect(match2.confidence).toBeGreaterThan(0.25);
    expect(match2.video).toBe('good');
  });

  test('bad confidence', () => {
    console.debug = jest.fn();
    expect(() => matchVideoConfidence({}, [
      { title: 'a title that can be matched quite well', videoId: 'bad1' },
      { title: 'this one shouldn\'t be matched actually', videoId: 'bad2' },
    ], 'some test title, a really bad one')).toThrow(/confidence/);
    expect(() => matchVideoConfidence({}, [
      { title: 'a test title', videoId: 'good1' },
      { title: 'is a test title', videoId: 'good2' },
    ], 'test title')).toThrow(/confidence/);
    expect(() => matchVideoConfidence({}, [
      { title: 'this one shouldn\'t be matched really', videoId: 'bad2' },
    ], 'test title')).toThrow(/confidence/);
    expect(() => matchVideoConfidence({}, [
      { title: 'this one shouldn\'t be matched because of low similarity', videoId: 'bad2' },
    ], 'test title with just a single matched word')).toThrow(/confidence/);
  });

  test('no videos', () => {
    expect(() => matchVideoConfidence({}, [], '')).toThrow();
    expect(matchVideoConfidence({}, 'test', '')).toEqual({ confidence: 1, video: 'test' });
  });
});