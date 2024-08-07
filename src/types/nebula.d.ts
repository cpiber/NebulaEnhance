

declare namespace Nebula {
  type PagedRequest<T> = {
    next: string,
    previous: string,
    results: T[],
  };

  type Video = {
    id: string,
    type: 'video_episode',
    slug: string,
    title: string,
    description: string,
    short_description: string,
    duration: number, // in seconds
    duration_to_complete: number,
    published_at: string,
    channel_slug: string,
    channel_slugs: string[],
    channel_title: string,
    category_slugs: string[],
    images: {
      channel_avatar: Image,
      thumbnail: Image,
    },
    attributes: string[],
    share_url: string,
    primary_channel: Channel,
    engagement: {
      id: string,
      watch_later: boolean,
      progress: VideoEngagement,
      primary_channel: {
        id: string,
        following: boolean,
      },
      updated_at: string,
    },
    zype_id: string,
  };

  type Channel = {
    id: string,
    type: 'video_channel',
    slug: string,
    title: string,
    published_at: string,
    description: string,
    assets: {
      avatar: Asset<IconSizes>,
      banner: Asset<BannerSizes>,
      hero: Asset<BannerSizes>,
      featured: Asset<BannerSizes>,
    },
    genre_category_title: string,
    genre_category_slug: string,
    categories: Category[],
    website: string,
    patreon: string,
    twitter: string,
    instagram: string,
    facebook: string,
    merch: string,
    merch_collection: string,
    share_url: string,
    engagement: ChannelEngagement,
    playlists: Playlist[],
    zype_id: string,
  };

  type Engagement = {
    id: string,
    watch_later: boolean,
    progress: VideoEngagement,
    primary_channel: {
      id: string,
      following: boolean,
    },
    updated_at: string,
  };

  type Featured<Typ, Item> = {
    type: Typ,
    id: string,
    title: string,
    size: string,
    view_all_url: string,
    attributes: string[],
    items: Item[];
  };
  type FeaturedVideos = Featured<'latest_videos', Omit<Video, 'type'> & { type: 'featured_video_episode'; }>;

  type VideoRequest = PagedRequest<Video>;

  type VideoSearchRequest = PagedRequest<Video>;

  type FeaturedRequest = (FeaturedVideos | Featured<never, never>)[];

  type Category = {
    slug: string,
    title: string,
  };

  type VideoEngagement = {
    updated_at: string,
    completed: boolean,
    value: number, // seconds
  };
  type ChannelEngagement = {
    following: boolean,
  };

  // incomplete
  type Playlist = Record<string, never>;

  type Asset<Sizes extends string = ImageSizes> = {
    [key in Sizes]: {
      original: string,
      [key: string]: string,
    }
  };

  type Image = {
    formats: string[],
    width: number,
    height: number,
    src: string,
  };

  type IconSizes = '16' | '32' | '64' | '128' | '256' | '512';
  type ThumbnailSizes = '240' | '480' | '720' | '1080';
  type BannerSizes = '240' | '360' | '480' | '720' | '960' | '1440' | '1920' | '2560';
  type ImageSizes = IconSizes | ThumbnailSizes | BannerSizes;
}