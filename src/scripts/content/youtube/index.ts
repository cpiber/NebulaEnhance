/**
 * This file is based on the work of Parker Addison (@parkeraddison)
 * @see https://github.com/parkeraddison/watch-on-nebula/blob/main/extension/scripts/content_script.js
 */

import { BrowserMessage, CancellableRepeatingAction, Message, debounce, getBrowserInstance, getFromStorage, injectScript, nebulavideo, sendMessage } from '../../helpers/sharedExt';
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

  // inject web content script
  await injectScript(getBrowserInstance().runtime.getURL('/scripts/youtube-helpers.js'), document.body);

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
  window.addEventListener('state-navigateend', (e: CustomEvent) => {
    console.dev.log('NAVIGATE2', e);
    const vidDetails = e.detail?.data?.response?.playerResponse?.videoDetails as YouTubePlayer.VideoDetails;
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
  let channelName = channelNice;
  const isMobile = location.host.startsWith('m.');

  async function* videoDetailsFromDOMDesktop() {
    if (first && vidID && videoTitle && channelID && channelNice) return;

    const channelElement = document.querySelector<HTMLAnchorElement>(
      '.ytd-video-owner-renderer + * .yt-formatted-string[href^="/channel/"], .ytd-video-owner-renderer + * .yt-formatted-string[href^="/@"]');
    const titleElement = document.querySelector<HTMLHeadingElement>('h1.ytd-video-primary-info-renderer');
    const idElement = document.querySelector('.ytd-page-manager[video-id]');
    console.dev.debug('Elements', !!channelElement, !!titleElement, !!idElement);
    if (!channelElement || !titleElement || !idElement) yield true; // retry

    // accessing custom attributes is not possible from content scripts, so inject this helper
    const foundChannelID = await sendMessage<string>(Message.GET_BROWSE_ID);
    channelID ??= foundChannelID;
    if (first && channelID !== foundChannelID) {
      channelName = channelNice;
    } else if (!first && channelID !== foundChannelID) {
      yield true; // retry
    } else {
      channelName = channelElement.href.split('/').pop();
    }

    videoTitle ??= titleElement.textContent;
    vidID ??= idElement.getAttribute('video-id');
  }

  async function* videoDetailsFromDOMMobile() {
    if (first && vidID && videoTitle && channelID && channelNice) return;

    const channelElement = document.querySelector<HTMLAnchorElement>('a.slim-owner-icon-and-title[href^="/@"]');
    const titleElement = document.querySelector<HTMLSpanElement>('h2.slim-video-information-title span');
    const idElement = document.querySelector('ytm-slim-video-metadata-section-renderer');
    console.dev.debug('Elements', !!channelElement, !!titleElement, !!idElement);
    if (!channelElement || !titleElement || !idElement) yield true; // retry

    // accessing custom attributes is not possible from content scripts, so inject this helper
    const foundChannelID = await sendMessage<string>(Message.GET_BROWSE_ID_MOBILE);
    channelID ??= foundChannelID;
    if (first && channelID !== foundChannelID) {
      channelName = channelNice;
    } else if (!first && channelID !== foundChannelID) {
      yield true; // retry
    } else {
      channelName = channelElement.href.split('/').pop();
    }

    videoTitle ??= titleElement.textContent;
    if (!vidID) {
      vidID = await sendMessage<string>(Message.GET_VID_ID_MOBILE);
    }
  }

  await action.run(async function* () {
    if (isMobile) {
      yield* videoDetailsFromDOMMobile();
    } else {
      yield* videoDetailsFromDOMDesktop();
    }
    const { res: vid, err }: { res?: nebulavideo, err?: any; } = await getBrowserInstance().runtime.sendMessage({ type: BrowserMessage.GET_VID, channelID, channelName, channelNice, videoTitle });
    console.dev.log('got:', vid, err);
    if (!vid) throw new Error(err);
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

    const subscribeElement = !isMobile ?
      document.querySelector<HTMLDivElement>('ytd-watch-metadata #subscribe-button, ytd-video-secondary-info-renderer #subscribe-button') :
      document.querySelector<HTMLDivElement>('ytm-slim-owner-renderer .slim-owner-subscribe-button');
    if (!subscribeElement) yield true; // retry

    const button = constructButton(vid, subscribeElement, isMobile);
    if (!isMobile) {
      subscribeElement.closest<HTMLDivElement>('#top-row.ytd-watch-metadata').style.display = 'block'; // not the prettiest, but it works
    } else {
      button.style.marginRight = '5px';
    }
    if ((window.history.state || {})['_enhancer_checked'] === true) return console.debug('Ignoring video since already processed');

    const { ytOpenTab: doOpenTab, ytMuteOnly: muteOnly, ytReplaceTab: replaceTab } = options;
    console.dev.debug('Referer:', document.referrer);
    if (document.referrer.match(/https?:\/\/(.+\.)?nebula\.(app|tv)\/?/) && window.history.length <= 1) return; // prevent open link if via nebula link (any link)
    if (vid.is === 'channel' || !doOpenTab) return;
    yield;

    /* eslint-disable-next-line camelcase */
    window.history.replaceState({ ...window.history.state, _enhancer_checked: true }, '');

    if (replaceTab) {
      window.location.href = vid.link;
      return;
    }

    window.open(vid.link, vidID);
    await sendMessage(!muteOnly ? Message.PAUSE_YT_VIDEO : Message.MUTE_YT_VIDEO, undefined, false);
  }, 500, 10_000);
}, 5);