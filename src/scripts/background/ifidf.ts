import { dot, norm } from '../helpers/shared';
import { normalizeString } from './misc';

type SearchableVideo = {
  title: string,
  videoId: string,
};
type VideoConfidence = {
  confidence: number,
  video: string,
};
type Cache = { [key: string]: VideoConfidence };

export const creatorHasVideo = async <T extends SearchableVideo>(vidcache: Cache, title: string, load: () => Promise<T[]>) => {
  if (!title)
    throw 'Title empty';
  title = normalizeString(title);
  if (title in vidcache)
    return vidcache[title];
  const vids = await load();
  return matchVideoConfidence(vidcache, vids.find(i => i.title === title)?.videoId || vids, title);
};

const MIN_PROB = 0.3;
export const matchVideoConfidence = <T extends SearchableVideo>(vidcache: Cache, vids: string | T[], title: string) => {
  if (typeof vids === 'string')
    return vidcache[title] = { confidence: 1, video: vids }; // exact match
  if (!vids.length)
    throw new Error('No videos');
  // if (vids.length <= 1)
  //   throw new Error('Not enough data');
  // lowercase, remove accents, split at spaces and sentence marks, remove common words, replace [0-12] with written words
  const exclude = [ 'the', 'is', 'a', 'and', 'or', 'as', 'of', 'be' ];
  const numbers = [ 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve' ];
  const split = (s: string) => normalizeString(s).split(/([\s\-_.,?!:;|]|\p{Pd})+/)
    .filter(t => t.trim() && exclude.indexOf(t) === -1)
    .map(v => numbers[+v] || v);
  const splitV = (v: T) => split(v.title);
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
  // term frequencies (expand to dict)
  const ifreq = (n: number, arr: number[], tarr: string[]) => {
    let lastind = 0;
    return dict.map(v => v !== tarr[lastind] ? 0 /* not in doc */ : arr[lastind++] / n /* calculate frequency, goto next */);
  };
  const tf = uterms.map((t, i) => ifreq(terms[i].length, t.occurences, t.values)); // length from original terms (with duplicates)
  const qf = ifreq(query.length, uquery.occurences, uquery.values);
  // non-standard check so see if query and single document are similar
  if (tf.length === 1) {
    const sim = dot(tf[0], qf) / (norm(tf[0]) * norm(qf));
    if (sim < MIN_PROB)
      throw new Error(`Not enough confidence (${sim})`);
    console.debug(`Matched video '${title}' with ${(sim * 100).toFixed(1)}% to`, vids[0].videoId);
    return vidcache[title] = { confidence: sim, video: vids[0].videoId };
  }
  // tfidf
  const idf = dc.map(c => Math.log(vids.length / c));
  const tfidf = tf.map(t => t.map((v, index) => v * idf[index]));
  const qfidf = qf.map((v, index) => v * idf[index]);
  const nfidf = norm(qfidf);
  // sanity check, this should never happen
  // tfidf.forEach(t => { if (t.length !== qfidf.length) throw new Error("Length mismatch"); });
  // find most similar (cosine similarity maximised)
  const sim = tfidf.map((t, i) => ({ prob: dot(t, qfidf) / (norm(t) * nfidf), vid: i }))
    .sort((a, b) => b.prob - a.prob);
  const best = sim[0];
  if (best.prob < MIN_PROB || best.prob - sim[1].prob < 0.05) // arbitrary threshold and distance
    throw new Error(`Not enough confidence (${best.prob}, ${sim[1].prob})`);
  console.debug(`Matched video '${title}' with ${(best.prob * 100).toFixed(1)}% to`, vids[best.vid].videoId);
  return vidcache[title] = { confidence: best.prob, video: vids[best.vid].videoId };
};