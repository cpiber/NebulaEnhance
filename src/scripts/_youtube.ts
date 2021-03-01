import { encode } from 'querystring';

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
        if (cur === p[0][p[0].length-1]) {
            p[1][p[1].length-1]++; // increase frequency
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
type ChannelListReply<T> = YoutubeReply<"youtube#channelListResponse", ChannelListChannel & T>;
type ChannelListChannel = YoutubeItem<"youtube#channel">;
type ChannelContentDetails = {
    contentDetails: {
        relatedPlaylists: {
            likes: string,
            favorites: string,
            uploads: string,
            [key: string]: string,
        }
    }
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
const loadYoutube = (creators: creator[]) => {
    // const load = (cs: creator[]) => {
    //     const url = new URL('https://youtube.googleapis.com/youtube/v3/channels');
    //     url.search = "?" + encode({
    //         part: 'contentDetails',
    //         id: cs.map(c => c.channel),
    //         key: __YT_API_KEY__,
    //         maxResults: 50,
    //     });
    //     return fetch(url.toString(),
    //         {
    //             "credentials": "omit",
    //             "headers": {
    //                 "Accept": "application/json, text/plain, */*",
    //                 "Accept-Language": "en-US,en;q=0.5",
    //                 "Cache-Control": "max-age=0"
    //             },
    //             "referrer": `https://watchnebula.com/`,
    //             "method": "GET",
    //             "mode": "cors"
    //         })
    //             .then(res => res.json())
    //             .then((res: ChannelListReply<ChannelContentDetails>) => {
    //                 if (!res || !res.pageInfo || !res.items || !res.items.length) {
    //                     console.log(res);
    //                     throw new Error("Invalid API response");
    //                 }
    //                 res.items.forEach(i => {
    //                     const c = cs.find(e => e.channel === i.id);
    //                     if (!c) return;
    //                     c.uploads = i.contentDetails.relatedPlaylists.uploads;
    //                 });
    //                 return cs;
    //             }).catch(console.error);
    // };
    // return Promise.all(array_chunks(creators, 50).map(load))
    //     .then(arr => (arr.filter(a => a !== undefined) as creator[][]).flat().filter(c => c.uploads));
    return creators.map(c => ({ ...c, uploads: 'UU' + c.channel.substr(2) }));
};
export const creatorHasVideo = (playlist: string, title: string, num: number) => {
    if (!playlist || !title)
        return Promise.reject(`Playlist or title empty: ${playlist}; ${title}`);
    let n = 0;
    title = title.toLowerCase().trim();
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
                    const v = res.items.find(e => e.snippet.title.toLowerCase().trim() === title);
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
        return vids; // exact match
    // lowercase, remove accents, split at spaces and sentence marks, remove common words
    const exclude = ['the', 'is', 'a', 'and', 'or'];
    const split = (s: string) =>
        s.toLowerCase().normalize("NFD").replace(/["'\u0300-\u036f]/g, '').split(/[\s-_.,?!:;]+/).filter(t => t && exclude.indexOf(t) === -1);
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
    const [ dict, dc ] = [...uterms.map(t => t[0]).flat(), ...uquery[0]].occurence();
    const idf = dc.map(c => Math.log(vids.length / c));
    // term frequencies (expand to dict)
    const ifreq = (n: number, arr: number[], tarr: string[]) => {
        let lastind = 0;
        return dict.map(v => {
            if (v !== tarr[lastind]) return 0; // not in doc
            return arr[lastind++] / n;
        });
    };
    const ti = uterms.map((t, _i) => {
        const l = terms[_i].length; // original terms (with duplicates)
        return ifreq(l, t[1], t[0]);
    });
    const qi = ifreq(query.length, uquery[1], uquery[0]);
    // tfidf
    const tfidf = ti.map(t => t.map((v, index) => v * idf[index]));
    const qfidf = qi.map((v, index) => v * idf[index]);
    const nfidf = norm(qfidf);
    // find most similar (cosine similarity maximised)
    const sim = tfidf.map((t, i) => [(dot(t, qfidf) / (norm(t) * nfidf)), i])
        .sort((a, b) => b[0] - a[0]);
    const best = sim[0];
    console.debug(best[0], best[1]);
    if (best[0] < 0.25) // arbitrary threshold
        throw new Error(`Not enough confidence (${best[0]})`);
    return vids[best[1]].videoId;
};

// https://stackoverflow.com/questions/8495687/split-array-into-chunks#comment84212474_8495740
const array_chunks = <T>(array: T[], chunk_size: number) => Array(Math.ceil(array.length / chunk_size)).fill(0).map((_, index) => index * chunk_size).map(begin => array.slice(begin, begin + chunk_size));