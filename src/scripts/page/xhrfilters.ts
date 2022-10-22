
const vidregex = /\/video\/*/;
export const filterVideos = (xhr: XMLHttpRequest, text: string, filter: string[], watchperc: number | undefined): string => {
  if (xhr.responseURL.indexOf('/video') === -1) return text;
  const u = new URL(xhr.responseURL);
  if (!u.pathname.match(vidregex)) return text;

  try {
    const content: Nebula.VideoSearchRequest = JSON.parse(text);
    const len = content.results.length;
    content.results = content.results.filter(r => !filter.includes(r.channel_slug));
    const len2 = content.results.length;
    console.info('Hiding', len - len2, 'video(s) by hidden creators');
    if (watchperc !== undefined) {
      content.results = content.results.filter(r => {
        const p = r.engagement.progress / r.duration;
        return p <= watchperc;
      });
      console.info('Hiding', len2 - content.results.length, 'watched video(s)');
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