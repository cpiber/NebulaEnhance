import { dot, norm, ytvideo } from './shared';

export type Creator = {
  name: string,
  channel: string,
  uploads: string,
};
export type Video = {
  title: string,
  videoId: string,
};

export const normalizeString = (str: string) => str.toLowerCase().normalize('NFD').replace(/\p{Pd}/g, '-')
/* eslint-disable-next-line no-misleading-character-class */
  .replace(/["'()[\]{}\u0300-\u036f]/g, '');

export const loadCreators = async () => {
  const res = await fetch('https://standard.tv/creators/');
  const body = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(body, 'text/html');
  const creators = Array.from(doc.querySelectorAll('#creator-wall .youtube-creator')).map(c => ({
    name: c.querySelector('img').alt,
    channel: c.getAttribute('data-video'),
  })).filter(c => c.channel);
  return loadYoutube(creators);
};
const loadYoutube = (creators: Omit<Creator, 'uploads'>[]) => creators.map(c => ({ ...c, uploads: 'UU' + c.channel.substr(2) }));

const plistcache: { [key: string]: Video[] } = {};
export const loadVideos = async (playlist: string, title: string, num: number) => {
  if (playlist in plistcache && plistcache[playlist].length >= num)
    return plistcache[playlist].slice(0, num);

  const videos: Video[] = [];
  let page = null;

  do {
    const url = new URL('https://youtube.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('playlistId', playlist);
    url.searchParams.set('key', __YT_API_KEY__);
    url.searchParams.set('maxResults', `${Math.min(num - videos.length, 50)}`);
    if (page)
      url.searchParams.set('pageToken', page);
    const data = await fetch(url.toString(),
      {
        credentials: 'omit',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'max-age=0',
        },
        referrer: 'https://nebula.app/',
        method: 'GET',
        mode: 'cors',
      });
    const res: YouTube.PlaylistItemsReply<YouTube.PlaylistItemSnippet> = await data.json();
    if (!res || !res.pageInfo || !res.items || !res.items.length)
      throw new Error('Invalid API response');
    const v = res.items.find(i => normalizeString(i.snippet.title) === title);
    if (v) return v.snippet.resourceId.videoId; // found the video
    const vids = res.items.map(i => ({ title: i.snippet.title, videoId: i.snippet.resourceId.videoId }));
    Array.prototype.push.apply(videos, vids);
    page = res.nextPageToken;
  } while (videos.length < num && page);
  return plistcache[playlist] = videos;
};

const vidcache: { [key: string]: ytvideo } = {};
export const creatorHasVideo = async (playlist: string, title: string, num: number): Promise<ytvideo> => {
  if (!playlist || !title)
    return Promise.reject(`Playlist or title empty: ${playlist}; ${title}`);
  title = normalizeString(title);
  if (title in vidcache)
    return vidcache[title];
  const vids = await loadVideos(playlist, title, num);
  return toVid(vids, title);
};

const toVid = (vids: string | Video[], title: string) => {
  if (typeof vids === 'string')
    return vidcache[title] = { confidence: 1, video: vids }; // exact match
  if (!vids.length)
    throw new Error('No videos');
  if (vids.length <= 1)
    throw new Error('Not enough data');
  // lowercase, remove accents, split at spaces and sentence marks, remove common words, replace [0-12] with written words
  const exclude = [ 'the', 'is', 'a', 'and', 'or', 'as', 'of', 'be' ];
  const numbers = [ 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve' ];
  const split = (s: string) => normalizeString(s).split(/([\s\-_.,?!:;|]|\p{Pd})+/)
    .filter(t => t.trim() && exclude.indexOf(t) === -1)
    .map(v => numbers[+v] || v);
  const splitV = (v: Video) => split(v.title);
  // approximate
  // IFIDF - Term frequency, Inverse Document Frequency
  // normalize terms in documents and query
  const terms = vids.map(splitV);
  const query = split(title);
  // for each document, get terms uniquely and count occurences
  const uterms = terms.map(ts => ts.occurence());
  const uquery = query.occurence();
  // count and create dict with unique terms
  const { values: dict, occurences: dc } = [ ...uterms.map(t => t.values).flat(), ...uquery.values ].occurence();
  const idf = dc.map(c => Math.log(vids.length / c));
  // term frequencies (expand to dict)
  const ifreq = (n: number, arr: number[], tarr: string[]) => {
    let lastind = 0;
    return dict.map(v => v !== tarr[lastind] ? 0 /* not in doc */ : arr[lastind++] / n /* calculate frequency, goto next */);
  };
  const tf = uterms.map((t, i) => ifreq(terms[i].length, t.occurences, t.values)); // length from original terms (with duplicates)
  const qf = ifreq(query.length, uquery.occurences, uquery.values);
  // tfidf
  const tfidf = tf.map(t => t.map((v, index) => v * idf[index]));
  const qfidf = qf.map((v, index) => v * idf[index]);
  const nfidf = norm(qfidf);
  // sanity check, this should never happen
  // tfidf.forEach(t => { if (t.length !== qfidf.length) throw new Error("Length mismatch"); });
  // find most similar (cosine similarity maximised)
  const sim = tfidf.map((t, i) => ({ prob: dot(t, qfidf) / (norm(t) * nfidf), vid: i }))
    .sort((a, b) => b.prob - a.prob);
  const best = sim[0];
  if (best.prob < 0.3 || best.prob - sim[1].prob < 0.05) // arbitrary threshold and distance
    throw new Error(`Not enough confidence (${best.prob}, ${sim[1].prob})`);
  return vidcache[title] = { confidence: best.prob, video: vids[best.vid].videoId };
};
export const matchVideoConfidence = toVid;
