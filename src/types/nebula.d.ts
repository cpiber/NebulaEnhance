declare namespace Nebula {
  type Video = {
    slug: string,
    title: string,
    description: string,
    short_description: string,
    duration: number,
    published_at: string,
    channel_slug: string,
    channel_slugs: string[],
    channel_title: string,
    category_slugs: string[],
    assets: {
      channel_avatar: Asset<IconSizes>,
      thumbnail: Asset<ThumbnailSizes>,
    },
    attributes: string[],
    share_url: string,
    channel: Channel,
    engagement: Engagement,
    zype_id: string,
  }

  type Channel = {
    slug: string,
    title: string,
    description: string,
    assets: {
      avatar: Asset<IconSizes>,
      banner: Asset<BannerSizes>,
      hero: Asset<BannerSizes>,
      featured: Asset<BannerSizes>
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
    engagement: Engagement,
    playlists: Playlist[],
    zype_id: string,
  }

  type VideoRequest = {
    details: Channel,
    episodes: {
      next: string,
      previous: string,
      results: Video[],
    },
  }

  type Category = {
    slug: string,
    title: string,
  }

  // possibly incomplete
  type Engagement = {
    following: boolean,
  }

  // incomplete
  type Playlist = {}

  type Asset<Sizes extends string = ImageSizes> = {
    [key in Sizes]: {
      original: string,
      [key: string]: string,
    }
  }

  type IconSizes = '16' | '32' | '64' | '128' | '256' | '512'
  type ThumbnailSizes = '240' | '480' | '720' | '1080'
  type BannerSizes = '240' | '360' | '480' | '720' | '960' | '1440' | '1920' | '2560'
  type ImageSizes = IconSizes | ThumbnailSizes | BannerSizes
}