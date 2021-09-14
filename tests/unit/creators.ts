import fetch from 'node-fetch';
import { loadCreators } from '../../src/scripts/background';
import { matchVideoConfidence } from '../../src/scripts/background/ifidf';

global.fetch = fetch as unknown as typeof global.fetch;

test('loading creators works', async () => {
  const creators = await loadCreators();
  expect(creators.length).not.toBe(0);
});

describe('matching', () => {
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
    ], 'test title')).toThrow(/data/);
    expect(() => matchVideoConfidence({}, [
      { title: 'this one shouldn\'t be matched because of low similarity', videoId: 'bad2' },
    ], 'test title with just a single matched word')).toThrow(/data/);
  });

  test('no videos', () => {
    expect(() => matchVideoConfidence({}, [], '')).toThrow();
    expect(matchVideoConfidence({}, 'test', '')).toEqual({ confidence: 1, video: 'test' });
  });
});