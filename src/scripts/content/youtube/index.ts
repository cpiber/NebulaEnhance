/**
 * This file is based on the work of Parker Addison (@parkeraddison)
 * @see https://github.com/parkeraddison/watch-on-nebula/blob/main/extension/scripts/content_script.js
 */

import { BrowserMessage, debounce, getBrowserInstance, getFromStorage, injectFunction, nebulavideo } from '../../helpers/sharedExt';
import { constructButton } from './html';

export const youtube = async () => {
  const { watchnebula } = await getFromStorage({ watchnebula: false });
  console.debug('Watch on Nebula:', watchnebula);

  if (!watchnebula) return;

  setTimeout(run, 0, true);

  // To support forward/backward page navigation changes.
  // The setTimeout must be used to ensure that this effectively runs on the *new* page.
  window.addEventListener('popstate', (event) => {
    console.dev.debug('history navigation');
    if (event.state)
      setTimeout(run, 2, false);
  });

  // To support YouTube navigation events (clicking)
  // Similar to history navigation, the setTimeout *must* be used, or the function
  // will essentially run on the previous page.
  window.addEventListener('yt-navigate-finish', () => {
    console.dev.debug('yt navigation');
    setTimeout(run, 1, true);
  });
};

let interval = 0;
const run = debounce((allowOpenTab: boolean) => {
  if (!location.pathname.startsWith('/watch'))
    return console.dev.debug('not a video'), undefined;

  Array.from(document.querySelectorAll('.watch-on-nebula')).forEach(n => n.remove());
  window.clearInterval(interval);
  interval = window.setInterval(async () => {
    const channelElement = document.querySelector<HTMLAnchorElement>('.ytd-video-owner-renderer + * .yt-formatted-string[href^="/channel/"]');
    const titleElement = document.querySelector<HTMLHeadingElement>('h1.ytd-video-primary-info-renderer');
    const subscribeElement = document.querySelector<HTMLDivElement>('ytd-video-secondary-info-renderer #subscribe-button');
    if (!channelElement || !titleElement || !subscribeElement) return;

    clearInterval(interval);
    const channelID = channelElement.href.split('/').pop();
    const videoTitle = titleElement.textContent;
    const vid: nebulavideo = await getBrowserInstance().runtime.sendMessage({ type: BrowserMessage.GET_VID, channelID, videoTitle });
    Array.from(document.querySelectorAll('.watch-on-nebula')).forEach(n => n.remove()); // sometimes the interval is killed while the request is running (double navigation)
    console.debug('got video information', '\nchannelID:', channelID, 'videoTitle:', videoTitle, 'on nebula?', !!vid);
    if (!vid) return;
    console.debug('Found video:', vid);
    subscribeElement.before(constructButton(vid));

    console.dev.debug('Referer:', document.referrer);
    if (document.referrer.match(/https?:\/\/(.+\.)?nebula\.app\/?/) && window.history.length <= 1) return; // prevent open link if via nebula link (any link)
    if (!allowOpenTab) return;
    const { ytOpenTab: doOpenTab } = await getFromStorage({ ytOpenTab: false });
    if (!doOpenTab) return;

    window.open(vid.link);
    injectFunction(document.body, () => document.querySelectorAll('video').forEach(v => v.pause()));
  }, 500);
}, 5);