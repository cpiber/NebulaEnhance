import { encode } from 'querystring';
import { ytvideo } from './_shared';

export type creator = {
    name: string,
    channel: string,
    uploads?: string,
};
type video = {
    title: string,
    videoId: string,
};

Array.prototype.occurence = function <T>(this: Array<T>) {
    return [...this].sort().reduce((prev, cur) => {
        const p = [[...prev[0]], [...prev[1]]] as typeof prev;
        if (cur === p[0][p[0].length - 1]) {
            p[1][p[1].length - 1]++; // increase frequency
            return p;
        }
        // new element
        p[0].push(cur);
        p[1].push(1);
        return p;
    }, [[], []] as [Array<T>, Array<number>]);
};
const dot = (t1: number[], t2: number[]) => t1.reduce((prev, cur, index) => prev + cur * t2[index], 0);
const norm = (t: number[]) => Math.sqrt(t.reduce((p, v) => p + v * v, 0));

export const loadCreators = () =>
    fetch('https://standard.tv')
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

type YoutubeReply<kind, T extends YoutubeItem<any>> = {
    kind: kind,
    etag: string,
    pageInfo: {
        totalResults: number,
        resultsPerPage: number,
    },
    items: T[],
    nextPageToken?: string,
    prevPageToken?: string,
}
type YoutubeItem<kind> = {
    kind: kind,
    etag: string,
    id: string,
};
type PlaylistItemsReply<T> = YoutubeReply<"youtube#playlistItemListResponse", PlaylistItem & T>;
type PlaylistItem = YoutubeItem<"youtube#playlistItem">;
type PlaylistItemSnippet = {
    snippet: {
        publishedAt: string,
        channelId: string,
        title: string,
        description: string,
        thumbnails: {
            [key in "default" | "medium" | "high" | "standard" | "maxres"]: {
                url: string,
                width: number,
                height: number,
            }
        },
        channelTitle: string,
        playlistId: string,
        position: number,
        resourceId: {
            kind: "youtube#video",
            videoId: string,
        },
        videoOwnerChannelTitle: string,
        videoOwnerChannelId: string,
    }
};
const loadYoutube = (creators: creator[]) => creators.map(c => ({ ...c, uploads: 'UU' + c.channel.substr(2) }));

const vidcache: { [key: string]: ytvideo } = {};
export const creatorHasVideo = (playlist: string, title: string, num: number): Promise<ytvideo> => {
    if (!playlist || !title)
        return Promise.reject(`Playlist or title empty: ${playlist}; ${title}`);
    title = title.toLowerCase().trim().replace(/\p{Pd}/g, '-');
    if (title in vidcache)
        return Promise.resolve(vidcache[title]);
    let n = 0;
    const load = (page: string = null, plist: video[] = []): Promise<string | video[]> => {
        const url = new URL('https://youtube.googleapis.com/youtube/v3/playlistItems');
        url.search = "?" + encode({
            part: 'snippet',
            playlistId: playlist,
            key: __YT_API_KEY__,
            maxResults: 50,
            pageToken: page,
        });
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
            .then((res: PlaylistItemsReply<PlaylistItemSnippet>) => {
                if (!res || !res.pageInfo || !res.items || !res.items.length) {
                    console.log(res);
                    throw new Error("Invalid API response");
                }
                n += res.items.length;
                const v = res.items.find(e => e.snippet.title.toLowerCase().trim().replace(/\p{Pd}/g, '-') === title);
                if (v) return v.snippet.resourceId.videoId; // found the video
                const vids = res.items.map(i => ({ title: i.snippet.title, videoId: i.snippet.resourceId.videoId }));
                const nlist = [...plist, ...vids];
                if (n < num && res.nextPageToken)
                    return load(res.nextPageToken, nlist);
                return nlist;
            })
    };
    return load().then(vids => toVid(vids, title)).catch(err => {
        console.error(err);
        return Promise.reject(err);
    });
};

const toVid = (vids: string | video[], title: string) => {
    if (typeof vids === "string")
        return vidcache[title] = { confidence: 1, video: vids }; // exact match
    // lowercase, remove accents, split at spaces and sentence marks, remove common words, replace [0-12] with written words
    const exclude = ['the', 'is', 'a', 'and', 'or', 'as', 'of'];
    const numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    const split = (s: string) =>
        s.toLowerCase().normalize("NFD").replace(/["'\(\)\[\]\{\}\u0300-\u036f]/g, '').split(/([\s\-_.,?!:;|]|\p{Pd})+/)
            .filter(t => t && exclude.indexOf(t) === -1).map(v => numbers[+v] || v);
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
    const [dict, dc] = [...uterms.map(t => t[0]).flat(), ...uquery[0]].occurence();
    const idf = dc.map(c => Math.log(vids.length / c));
    // term frequencies (expand to dict)
    const ifreq = (n: number, arr: number[], tarr: string[]) => {
        let lastind = 0;
        return dict.map(v => v !== tarr[lastind] ? 0 /* not in doc */ : arr[lastind++] / n /* calculate frequency, goto next */);
    };
    const tf = uterms.map((t, i) => ifreq(terms[i].length, t[1], t[0])); // length from original terms (with duplicates)
    const qf = ifreq(query.length, uquery[1], uquery[0]);
    // tfidf
    const tfidf = tf.map(t => t.map((v, index) => v * idf[index]));
    const qfidf = qf.map((v, index) => v * idf[index]);
    const nfidf = norm(qfidf);
    // find most similar (cosine similarity maximised)
    const sim = tfidf.map((t, i) => [dot(t, qfidf) / (norm(t) * nfidf), i])
        .sort((a, b) => b[0] - a[0]);
    const best = sim[0];
    console.debug(best[0], best[1], vids[best[1]]);
    if (best[0] < 0.25) // arbitrary threshold
        throw new Error(`Not enough confidence (${best[0]} < 0.25)`);
    return vidcache[title] = { confidence: best[0], video: vids[best[1]].videoId };
};
