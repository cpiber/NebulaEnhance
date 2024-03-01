/**
 * This file is based on the work of Parker Addison (@parkeraddison)
 * @see https://github.com/parkeraddison/watch-on-nebula/blob/main/extension/scripts/content_script.js
 */

import { BrowserMessage, CancellableRepeatingAction, debounce, getBrowserInstance, getFromStorage, injectFunction, injectFunctionWithReturn, nebulavideo } from '../../helpers/sharedExt';
import { constructButton } from './html';

const optionsDefaults = {
  watchnebula: false,
  ytOpenTab: false,
  ytMuteOnly: false,
  ytReplaceTab: false,
};
let options = { ...optionsDefaults };

export const youtube = async () => {
  const { watchnebula } = options = await getFromStorage(optionsDefaults);
  console.debug('Watch on Nebula:', watchnebula);
  getBrowserInstance().storage.onChanged.addListener(changed => {
    Object.keys(options).forEach(prop => {
      if (prop in changed && 'newValue' in changed[prop]) {
        options[prop] = changed[prop].newValue as typeof options[typeof prop];
      }
    });
    console.dev.debug('Reload information', changed);
    setTimeout(run, 100);
  });

  if (location.host.startsWith('m.')) return console.error('Enhancer for Nebula: YouTube mobile is currently not supported!');

  Array.from(document.querySelectorAll<HTMLElement>('.watch-on-nebula')).forEach(n => n.remove());
  setTimeout(run, 0);

  window.addEventListener('yt-navigate-finish', (e: CustomEvent) => {
    console.dev.log('NAVIGATE', e);
    const vidDetails = e.detail?.response?.playerResponse?.videoDetails as YouTubePlayer.VideoDetails;
    remove();
    if (!vidDetails) return;
    console.log('VID id', vidDetails.videoId, 'title', vidDetails.title, 'CHANNEL author', vidDetails.author, 'Id', vidDetails.channelId);
    run({ vidID: vidDetails.videoId, videoTitle: vidDetails.title, channelID: vidDetails.channelId, channelNice: vidDetails.author });
  });
};

const action = new CancellableRepeatingAction();
const remove = () => Array.from(document.querySelectorAll<HTMLElement>('.watch-on-nebula')).forEach(n => n.style.display = 'none');
const run = debounce(async ({ vidID, videoTitle, channelID, channelNice }: { vidID?: string, videoTitle?: string, channelID?: string, channelNice?: string; } = {}) => {
  if (!location.pathname.startsWith('/watch')) {
    console.dev.log('not a video');
    action.cancel();
    remove();
    return;
  }
  action.cancel();
  if (!options.watchnebula) return Array.from(document.querySelectorAll<HTMLElement>('.watch-on-nebula')).forEach(n => n.remove());
  let first = true;

  await action.run(async function* () {
    const channelElement = document.querySelector<HTMLAnchorElement>(
      '.ytd-video-owner-renderer + * .yt-formatted-string[href^="/channel/"], .ytd-video-owner-renderer + * .yt-formatted-string[href^="/@"]');
    const titleElement = document.querySelector<HTMLHeadingElement>('h1.ytd-video-primary-info-renderer');
    const subscribeElement = document.querySelector<HTMLDivElement>('ytd-watch-metadata #subscribe-button, ytd-video-secondary-info-renderer #subscribe-button');
    const idElement = document.querySelector('.ytd-page-manager[video-id]');
    console.dev.debug('Elements', !!channelElement, !!titleElement, !!subscribeElement, !!idElement);
    if (!channelElement || !titleElement || !subscribeElement || !idElement) yield true; // retry

    // accessing custom attributes is not possible from content scripts, so inject this helper
    const foundChannelID = await injectFunctionWithReturn(document.body, () =>
      (document.querySelector('ytd-channel-name .yt-simple-endpoint') as any).data.browseEndpoint.browseId as string);
    channelID ??= foundChannelID;
    let channelName = channelElement.href.split('/').pop();
    if (first && channelID !== foundChannelID) {
      channelName = channelNice;
    } else if (!first && channelID !== foundChannelID) {
      yield true; // retry
    }

    videoTitle ??= titleElement.textContent;
    const vid: nebulavideo = await getBrowserInstance().runtime.sendMessage({ type: BrowserMessage.GET_VID, channelID, channelName, channelNice, videoTitle });
    vidID ??= idElement.getAttribute('video-id');
    console.debug('got video information',
      '\nchannelID:', channelID, 'channelName:', channelName, '(', channelNice, ')', 'videoTitle:', videoTitle, 'vidID:', vidID,
      '\non nebula?', !!vid);

    if (!vid && first) {
      console.dev.log('Retrying afterwards with channel name');
      first = false;
      yield true; // retry when we have a channel name
    }
    if (!vid) return remove();
    console.dev.log('Found video:', vid);
    first = false;

    subscribeElement.before(constructButton(vid));
    subscribeElement.closest<HTMLDivElement>('#top-row.ytd-watch-metadata').style.display = 'block'; // not the prettiest, but it works
    if ((window.history.state || {})['_enhancer_checked'] === true) return console.debug('Ignoring video since already processed');

    const { ytOpenTab: doOpenTab, ytMuteOnly: muteOnly, ytReplaceTab: replaceTab } = options;
    console.dev.debug('Referer:', document.referrer);
    if (document.referrer.match(/https?:\/\/(.+\.)?nebula\.(app|tv)\/?/) && window.history.length <= 1) return; // prevent open link if via nebula link (any link)
    if (vid.is === 'channel' || !doOpenTab) return;
    yield;

    if (replaceTab) {
      /* eslint-disable-next-line camelcase */
      window.history.replaceState({ ...window.history.state, _enhancer_checked: true }, '');
      window.location.href = vid.link;
      return;
    }

    window.open(vid.link, vidID);
    injectFunction(document.body, !muteOnly ? () => {
      document.querySelectorAll('video').forEach(v => {
        try {
          v.pause();
          (v.parentElement.parentElement as unknown as YouTubePlayer.MediaPlayer).pauseVideo();
        } catch (e) {
          console.dev.error(e);
        }
      });
    } : () => {
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
    });
  }, 500, 10_000);
}, 5);