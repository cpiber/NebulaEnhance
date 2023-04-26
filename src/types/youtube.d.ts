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
  type PlaylistItemsReply<T> = YoutubeReply<'youtube#playlistItemListResponse', PlaylistItem & T>;
  type PlaylistItem = YoutubeItem<'youtube#playlistItem'>;
  type PlaylistItemSnippet = {
    snippet: {
      publishedAt: string,
      channelId: string,
      title: string,
      description: string,
      thumbnails: {
        [key in 'default' | 'medium' | 'high' | 'standard' | 'maxres']: {
          url: string,
          width: number,
          height: number,
        }
      },
      channelTitle: string,
      playlistId: string,
      position: number,
      resourceId: {
        kind: 'youtube#video',
        videoId: string,
      },
      videoOwnerChannelTitle: string,
      videoOwnerChannelId: string,
    };
  };
}

declare namespace YouTubePlayer {
  type PlayerEvent = 'CONNECTION_ISSUE' | 'SIZE_CLICKED' | 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'WATCH_LATER_VIDEO_ADDED' | 'WATCH_LATER_VIDEO_REMOVED' | 'changeEngagementPanelVisibility' | 'cinematicSettingsToggleChange' | 'innertubeCommand' | 'onAdStateChange' | 'onAutonavChangeRequest' | 'onAutonavCoundownStarted' | 'onAutonavPauseRequest' | 'onCollapseMiniplayer' | 'onFeedbackArticleRequest' | 'onFeedbackStartRequest' | 'onFullerscreenEduClicked' | 'onFullscreenChange' | 'onOfflineOperationFailure' | 'onOrchestrationBecameLeader' | 'onOrchestrationLostLeader' | 'onPlayVideo' | 'onStateChange' | 'onVideoDataChange' | 'onVideoProgress' | 'onYpcContentRequest' | 'onYtShowToast' | 'updateEngagementPanelAction' | 'updateKevlarOrC3Companion';

  type MediaPlayer = {
    pauseVideo(): void;
    playVideo(): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    addEventListener(ev: PlayerEvent, fn: (...args: any[]) => void): void;
    removeEventListener(ev: PlayerEvent, fn: (...args: any[]) => void): void;
  };
}