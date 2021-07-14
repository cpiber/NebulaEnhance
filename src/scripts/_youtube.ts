import { dot, norm, ytvideo } from './_shared';

export type creator = {
    name: string,
    channel: string,
    uploads?: string,
};
export type video = {
    title: string,
    videoId: string,
};

export const loadCreators = () =>
    fetch('https://standard.tv/creators/')
        .then(res => res.text())
        .then(body => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(body, "text/html");
            return Array.from(doc.querySelectorAll('#creator-wall .youtube-creator')).map(c => ({
                name: c.querySelector('img').alt,
                channel: c.getAttribute('data-video'),
            })).filter(c => c.channel);
        })
        .then(loadYoutube);
const loadYoutube = (creators: creator[]) => creators.map(c => ({ ...c, uploads: 'UU' + c.channel.substr(2) }));

export const loadVideos = (playlist: string, title: string, num: number) => {
    let n = 0;
    const load = (page: string = null, plist: video[] = []): Promise<string | video[]> => {
        const url = new URL('https://youtube.googleapis.com/youtube/v3/playlistItems');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('playlistId', playlist);
        url.searchParams.set('key', __YT_API_KEY__);
        url.searchParams.set('maxResults', `${Math.min(num - n, 50)}`);
        if (page)
            url.searchParams.set('pageToken', page);
        return fetch(url.toString(),
            {
                "credentials": "omit",
                "headers": {
                    "Accept": "application/json, text/plain, */*",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Cache-Control": "max-age=0"
                },
                "referrer": `https://watchnebula.com/`,
                "method": "GET",
                "mode": "cors"
            })
            .then(res => res.json())
            .then((res: YouTube.PlaylistItemsReply<YouTube.PlaylistItemSnippet>) => {
                if (!res || !res.pageInfo || !res.items || !res.items.length)
                    throw new Error("Invalid API response");
                n += res.items.length;
                const v = res.items.find(e => e.snippet.title.toLowerCase().trim().replace(/\p{Pd}/g, '-') === title);
                if (v) return v.snippet.resourceId.videoId; // found the video
                const vids = res.items.map(i => ({ title: i.snippet.title, videoId: i.snippet.resourceId.videoId }));
                const nlist = [...plist, ...vids];
                if (n < num && res.nextPageToken)
                    return load(res.nextPageToken, nlist);
                return nlist;
            });
    };
    return load();
};

const vidcache: { [key: string]: ytvideo } = {};
export const creatorHasVideo = (playlist: string, title: string, num: number): Promise<ytvideo> => {
    if (!playlist || !title)
        return Promise.reject(`Playlist or title empty: ${playlist}; ${title}`);
    title = title.toLowerCase().trim().replace(/\p{Pd}/g, '-');
    if (title in vidcache)
        return Promise.resolve(vidcache[title]);
    return loadVideos(playlist, title, num).then(vids => toVid(vids, title)).catch(err => {
        console.error(err);
        return Promise.reject(err);
    });
};

const toVid = (vids: string | video[], title: string) => {
    if (typeof vids === "string")
        return vidcache[title] = { confidence: 1, video: vids }; // exact match
    if (!vids.length)
        throw new Error("No videos");
    // lowercase, remove accents, split at spaces and sentence marks, remove common words, replace [0-12] with written words
    const exclude = ['the', 'is', 'a', 'and', 'or', 'as', 'of', 'be'];
    const numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    const split = (s: string) =>
        s.toLowerCase().normalize("NFD").replace(/["'\(\)\[\]\{\}\u0300-\u036f]/g, '').split(/([\s\-_.,?!:;|]|\p{Pd})+/)
            .filter(t => t.trim() && exclude.indexOf(t) === -1).map(v => numbers[+v] || v);
    const splitV = (v: video) => split(v.title);
    // approximate
    // IFIDF - Term frequency, Inverse Document Frequency
    // normalize terms in documents and query
    const terms = vids.map(splitV);
    const query = split(title);
    // for each document, get terms uniquely and count occurences
    const uterms = terms.map(ts => ts.occurence());
    const uquery = query.occurence();
    // count and create dict with unique terms
    const { values: dict, occurences: dc } = [...uterms.map(t => t.values).flat(), ...uquery.values].occurence();
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
    tfidf.forEach(t => { if (t.length !== qfidf.length) throw new Error("Length mismatch"); });
    // find most similar (cosine similarity maximised)
    const sim = tfidf.map((t, i) => ({ prob: dot(t, qfidf) / (norm(t) * nfidf), vid: i}))
        .sort((a, b) => b.prob - a.prob);
    const best = sim[0];
    console.debug(best.prob, best.vid, vids[best.vid]);
    if (best.prob < 0.3 || sim.length > 1 && best.prob - sim[1].prob < 0.05) // arbitrary threshold and distance
        throw new Error(`Not enough confidence (${best.prob}, ${sim.length > 1 ? sim[1].prob : 0})`);
    return vidcache[title] = { confidence: best.prob, video: vids[best.vid].videoId };
};
export const matchVideoConfidence = toVid;
