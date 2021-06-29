declare namespace YouTube {
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
    };
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
}