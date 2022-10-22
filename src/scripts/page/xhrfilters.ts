
const vidregex = /^\/(?:library\/)?video\/*$/;
export const filterVideos = (xhr: XMLHttpRequest, text: string, filter: string[], watchperc: number | undefined): string => {
  if (xhr.responseURL.indexOf('/video') === -1) return text;
  const u = new URL(xhr.responseURL);
  if (!u.pathname.match(vidregex)) return text;

  try {
    const content: Nebula.VideoSearchRequest = JSON.parse(text);
    const len = content.results.length;
    content.results = content.results.filter(r => !filter.includes(r.channel_slug));
    const len2 = content.results.length;
    console.debug('Hiding', len - len2, 'video(s) by hidden creators');
    if (watchperc !== undefined) {
      content.results = content.results.filter(r => {
        const p = r.engagement.progress / r.duration * 100;
        return p <= watchperc;
      });
      console.debug('Hiding', len2 - content.results.length, 'watched video(s)');
    }
    return JSON.stringify(content);
  } catch (e) {
    console.groupCollapsed('Error filtering', xhr.responseURL);
    console.error(e);
    console.log(xhr);
    console.log(text);
    console.groupEnd();
    return text;
  }
};

const featregex = /^\/featured\/*$/;
export const filterFeatured = (xhr: XMLHttpRequest, text: string, filter: string[], watchperc: number | undefined): string => {
  if (xhr.responseURL.indexOf('/featured') === -1) return text;
  const u = new URL(xhr.responseURL);
  if (!u.pathname.match(featregex)) return text;

  try {
    const content: Nebula.FeaturedRequest = JSON.parse(text);
    let hidden = 0;
    let watched = 0;
    for (let i = 0; i < content.length; ++i) {
      if (content[i].type !== 'latest_videos') continue;
      const c = content[i] as Nebula.FeaturedVideos;
      const len = c.items.length;
      c.items = c.items.filter(r => !filter.includes(r.channel_slug));
      const len2 = c.items.length;
      hidden += len - len2;
      if (watchperc !== undefined) {
        c.items = c.items.filter(r => {
          const p = r.engagement.progress / r.duration * 100;
          return p <= watchperc;
        });
        watched += len2 - c.items.length;
      }
    }
    console.debug('Hiding', hidden, 'video(s) by hidden creators');
    if (watchperc !== undefined) console.debug('Hiding', watched, 'watched video(s)');
    return JSON.stringify(content);
  } catch (e) {
    console.groupCollapsed('Error filtering', xhr.responseURL);
    console.error(e);
    console.log(xhr);
    console.log(text);
    console.groupEnd();
    return text;
  }
};