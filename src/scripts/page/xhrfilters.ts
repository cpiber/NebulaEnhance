import type { CreatorSettings } from '../content/nebula/creator-settings';
import { uploadIsBefore, uploadIsLongerThan } from '../helpers/shared';

/* eslint-disable camelcase */
const createDummyVideo = (): Nebula.Video => ({
  id: '-1',
  type: 'video_episode',
  slug: '_dummy_episode_',
  title: '__DUMMY__',
  description: '',
  short_description: '',
  duration: -1,
  duration_to_complete: -1,
  published_at: '',
  channel_slug: '_dummy_channel_',
  channel_slugs: [],
  channel_title: '__DUMMY__',
  category_slugs: [],
  images: {
    channel_avatar: { formats: [], height: 0, width: 0, src: 'https://nebula.tv/' },
    thumbnail: { formats: [], height: 0, width: 0, src: 'https://nebula.tv/' },
  },
  attributes: [],
  share_url: '',
  primary_channel: null,
  engagement: null,
  zype_id: '',
});
/* eslint-enable camelcase */

const engagementCache: Record<string, number> = {};

const vidregex = /^\/(?:library\/)?video_episodes\/*$/;
export const filterVideos = (xhr: XMLHttpRequest, text: string, filter: string[], creatorSettings: Record<string, CreatorSettings>, creatorHideAfter: Record<string, number>, creatorHideIfLonger: Record<string, number>, watchperc: number | undefined, showWatched: boolean): string => {
  const url = xhr.responseURL;
  console.dev.debug('Considering', url, 'for filtering video list');
  if (url.indexOf('/video_episodes') === -1) return text;
  const u = new URL(url);
  if (!u.pathname.match(vidregex)) return text;

  try {
    const content: Nebula.VideoSearchRequest = JSON.parse(text);
    const len = content.results.length;
    content.results = content.results.filter(r => !filter.includes(r.channel_slug));
    const len2 = content.results.length;
    console.debug('Hiding', len - len2, 'video(s) by hidden creators');
    if (!showWatched) {
      if (watchperc !== undefined) {
        content.results = content.results.filter(r => {
          if ((r.engagement?.progress?.value ?? null) === null && !(r.id in engagementCache)) return true;
          const engagement = r.engagement?.progress?.value ?? engagementCache[r.id];
          console.assert(engagement !== undefined && engagement !== null, 'Expected engagement value', r.engagement, engagementCache[r.id]);
          const p = engagement / r.duration * 100;
          return p <= watchperc;
        });
        console.debug('Hiding', len2 - content.results.length, 'watched video(s) with', Object.keys(engagementCache).length, 'in engagement cache');
      }
      const len3 = content.results.length;
      content.results = content.results.filter(r => {
        const creator = r.channel_slug;
        return !(creator in creatorHideAfter) || !uploadIsBefore(Date.parse(r.published_at), creatorHideAfter[creator]);
      });
      console.debug('Hiding', len3 - content.results.length, 'older video(s)');
      const len4 = content.results.length;
      content.results = content.results.filter(r => {
        const creator = r.channel_slug;
        return !(creator in creatorHideIfLonger) || !uploadIsLongerThan(r.duration, creatorHideIfLonger[creator]);
      });
      console.debug('Hiding', len4 - content.results.length, 'long video(s)');
      const len5 = content.results.length;
      content.results = content.results.filter(r => {
        const creator = r.channel_slug;
        return !(creator in creatorSettings) || !creatorSettings[creator].hidePlus || !r.attributes.includes('is_nebula_plus');
      });
      console.debug('Hiding', len5 - content.results.length, 'plus video(s)');
    }
    if (len !== 0 && content.results.length === 0) content.results.push(createDummyVideo());
    return JSON.stringify(content);
  } catch (e) {
    console.groupCollapsed('Error filtering', url);
    console.error(e);
    console.log(xhr);
    console.log(text);
    console.groupEnd();
    return text;
  }
};

const engageregex = /^\/(?:library\/)?video_episodes\/engagement\/*$/;
export const collectEngagement = (xhr: XMLHttpRequest, text: string): void => {
  const url = xhr.responseURL;
  console.dev.debug('Considering', url, 'for collecting engagement');
  if (url.indexOf('/video_episodes') === -1) return;
  const u = new URL(url);
  if (!u.pathname.match(engageregex)) return;

  try {
    const content: Nebula.PagedRequest<Nebula.Engagement> = JSON.parse(text);
    content.results.forEach(r => {
      if (r.progress === null) return;
      engagementCache[r.id] = r.progress.value;
    });
    console.debug('Collected engagement for', content.results.length, 'video(s)');
  } catch (e) {
    console.groupCollapsed('Error filtering', url);
    console.error(e);
    console.log(xhr);
    console.log(text);
    console.groupEnd();
  }
};

const featregex = /^\/featured\/*$/;
export const filterFeatured = (xhr: XMLHttpRequest, text: string, filter: string[], creatorSettings: Record<string, CreatorSettings>, creatorHideAfter: Record<string, number>, creatorHideIfLonger: Record<string, number>, watchperc: number | undefined): string => {
  const url = xhr.responseURL;
  console.dev.debug('Considering', url, 'for filtering featured');
  if (url.indexOf('/featured') === -1) return text;
  const u = new URL(url);
  if (!u.pathname.match(featregex)) return text;

  try {
    const content: Nebula.FeaturedRequest = JSON.parse(text);
    let hidden = 0;
    let watched = 0;
    let old = 0;
    let long = 0;
    let plus = 0;
    for (let i = 0; i < content.length; ++i) {
      if (content[i].type !== 'latest_videos') continue;
      const c = content[i] as Nebula.FeaturedVideos;
      const len = c.items.length;
      c.items = c.items.filter(r => !filter.includes(r.channel_slug));
      const len2 = c.items.length;
      hidden += len - len2;
      if (watchperc !== undefined) {
        c.items = c.items.filter(r => {
          if ((r.engagement?.progress?.value ?? null) === null && !(r.id in engagementCache)) return true;
          const engagement = r.engagement?.progress?.value ?? engagementCache[r.id];
          console.assert(engagement !== undefined && engagement !== null, 'Expected engagement value', r.engagement, engagementCache[r.id]);
          const p = engagement / r.duration * 100;
          return p <= watchperc;
        });
        watched += len2 - c.items.length;
      }
      const len3 = c.items.length;
      c.items = c.items.filter(r => {
        const creator = r.channel_slug;
        return !(creator in creatorHideAfter) || !uploadIsBefore(Date.parse(r.published_at), creatorHideAfter[creator]);
      });
      old += len3 - c.items.length;
      const len4 = c.items.length;
      c.items = c.items.filter(r => {
        const creator = r.channel_slug;
        return !(creator in creatorHideIfLonger) || !uploadIsLongerThan(r.duration, creatorHideIfLonger[creator]);
      });
      long += len4 - c.items.length;
      const len5 = c.items.length;
      c.items = c.items.filter(r => {
        const creator = r.channel_slug;
        return !(creator in creatorSettings) || !creatorSettings[creator].hidePlus || !r.attributes.includes('is_nebula_plus');
      });
      plus += len5 - c.items.length;
    }
    console.debug('Hiding', hidden, 'video(s) by hidden creators');
    if (watchperc !== undefined) console.debug('Hiding', watched, 'watched video(s) with', Object.keys(engagementCache).length, 'in engagement cache');
    console.debug('Hiding', old, 'older video(s)');
    console.debug('Hiding', long, 'long video(s)');
    console.debug('Hiding', plus, 'plus video(s)');
    return JSON.stringify(content);
  } catch (e) {
    console.groupCollapsed('Error filtering', url);
    console.error(e);
    console.log(xhr);
    console.log(text);
    console.groupEnd();
    return text;
  }
};