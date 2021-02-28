import { encode } from 'querystring';

export type creator = {
    name: string,
    channel: string,
    uploads?: string,
};

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
    const load = (page: string = null): Promise<string> => {
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
                    if (n < num && res.nextPageToken) return load(res.nextPageToken);
                    return Promise.reject('Ran out of tries');
                })
    };
    return load().catch(err => {
        console.error(err);
        return Promise.reject(err);
    });
};

// https://stackoverflow.com/questions/8495687/split-array-into-chunks#comment84212474_8495740
const array_chunks = <T>(array: T[], chunk_size: number) => Array(Math.ceil(array.length / chunk_size)).fill(0).map((_, index) => index * chunk_size).map(begin => array.slice(begin, begin + chunk_size));