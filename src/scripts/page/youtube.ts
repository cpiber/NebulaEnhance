
export const getBrowseId = () => (document.querySelector('ytm-subscribe-button-renderer, ytd-subscribe-button-renderer') as any)?.data?.channelId as string;

export const getVidIdMobile = () => (document.querySelector('ytm-slim-video-metadata-section-renderer') as any)?.data?.videoId as string;

export const pauseVideo = () => {
  document.querySelectorAll('video').forEach(v => {
    try {
      v.pause();
      (v.parentElement.parentElement as unknown as YouTubePlayer.MediaPlayer).pauseVideo();
    } catch (e) {
      console.dev.error(e);
    }
  });
};

export const muteVideo = () => {
  document.querySelectorAll('video').forEach(v => {
    try {
      const player = v.parentElement.parentElement as unknown as YouTubePlayer.MediaPlayer;
      if (player.isMuted()) return;

      const cbStateChange = (state: number) => {
        if (state > 0) return; // stopped=0, killed=-1 ?
        player.unMute();
        player.removeEventListener('onStateChange', cbStateChange);
        player.removeEventListener('onVideoDataChange', cbDataChange);
      };
      const cbDataChange = () => {
        player.unMute();
        player.removeEventListener('onStateChange', cbStateChange);
        player.removeEventListener('onVideoDataChange', cbDataChange);
      };
      player.mute();
      player.addEventListener('onStateChange', cbStateChange);
      player.addEventListener('onVideoDataChange', cbDataChange);
    } catch (e) {
      console.dev.error(e);
    }
  });
};