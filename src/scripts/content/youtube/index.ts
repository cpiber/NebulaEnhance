/**
 * This file is based on the work of Parker Addison (@parkeraddison)
 * @see https://github.com/parkeraddison/watch-on-nebula/blob/main/extension/scripts/content_script.js
 */

import { BrowserMessage, debounce, getBrowserInstance, getFromStorage, injectFunctionWithReturn, nebulavideo } from '../../helpers/sharedExt';
import { constructButton } from './html';

export const youtube = async () => {
  const { watchnebula } = await getFromStorage({ watchnebula: false });
  console.debug('Watch on Nebula:', watchnebula);

  if (!watchnebula) return;
  if (location.host.startsWith('m.')) return console.error('Enhancer for Nebula: YouTube mobile is currently not supported!');

  setTimeout(run, 0, false);

  // To support forward/backward page navigation changes.
  // The setTimeout must be used to ensure that this effectively runs on the *new* page.
  window.addEventListener('popstate', (event) => {
    console.dev.log('history navigation');
    if (event.state)
      setTimeout(run, 2, false);
  });

  // To support YouTube navigation events (clicking)
  // Similar to history navigation, the setTimeout *must* be used, or the function
  // will essentially run on the previous page.
  window.addEventListener('yt-action', (ev: CustomEvent) => {
    if (!ev.detail) return;
    const act = ev.detail.actionName;
    console.dev.debug(`yt action: ${act}`);
    if (![ 'yt-history-load', 'ytd-log-youthere-nav', 'yt-deactivate-miniplayer-action' ].includes(act) &&
      document.querySelector('.watch-on-nebula')) return;
    console.dev.log(`yt action triggered re-run: ${act}`);
    setTimeout(run, 1, true);
  });
};

let interval = 0;
const run = debounce((allowOpenTab: boolean) => {
  if (!location.pathname.startsWith('/watch'))
    return console.dev.log('not a video'), undefined;

  const stop = () => {
    window.clearInterval(interval);
    interval = 0;
  };
  if (interval !== 0) stop(); // restart interval

  Array.from(document.querySelectorAll('.watch-on-nebula')).forEach(n => n.remove());
  window.setTimeout(stop, 10_000);
  interval = window.setInterval(async () => {
    const channelElement = document.querySelector<HTMLAnchorElement>(
      '.ytd-video-owner-renderer + * .yt-formatted-string[href^="/channel/"], .ytd-video-owner-renderer + * .yt-formatted-string[href^="/c/"]');
    const titleElement = document.querySelector<HTMLHeadingElement>('h1.ytd-video-primary-info-renderer');
    const subscribeElement = document.querySelector<HTMLDivElement>('ytd-watch-metadata #subscribe-button, ytd-video-secondary-info-renderer #subscribe-button');
    const idElement = document.querySelector('.ytd-page-manager[video-id]');
    console.dev.debug('Elements', !!channelElement, !!titleElement, !!subscribeElement, !!idElement);
    if (!channelElement || !titleElement || !subscribeElement || !idElement) return;

    stop();
    // accessing custom attributes is not possible from content scripts, so inject this helper
    const channelID = await injectFunctionWithReturn(document.body, () =>
      (document.querySelector('ytd-video-owner-renderer.ytd-video-secondary-info-renderer') as any).__data.data.navigationEndpoint.browseEndpoint.browseId as string);
    const channelName = channelElement.href.split('/').pop();
    const videoTitle = titleElement.textContent;
    const vid: nebulavideo = await getBrowserInstance().runtime.sendMessage({ type: BrowserMessage.GET_VID, channelID, channelName, videoTitle });
    Array.from(document.querySelectorAll('.watch-on-nebula')).forEach(n => n.remove()); // sometimes the interval is killed while the request is running (double navigation)
    console.debug('got video information', '\nchannelID:', channelID, 'channelName:', channelName, 'videoTitle:', videoTitle, 'on nebula?', !!vid);
    if (!vid) return;
    console.dev.log('Found video:', vid);
    subscribeElement.before(constructButton(vid));
    const wrap = document.querySelector('ytd-watch-metadata');
    if (wrap) wrap.setAttribute('larger-item-wrap', ''); // make sure youtube displays two lines for space for the button
    subscribeElement.parentElement.style.minWidth = '450px'; // actually even larger still

    console.dev.debug('Referer:', document.referrer);
    if (document.referrer.match(/https?:\/\/(.+\.)?nebula\.app\/?/) && window.history.length <= 1) return; // prevent open link if via nebula link (any link)
    if (!allowOpenTab || vid.is === 'channel') return;
    const { ytOpenTab: doOpenTab } = await getFromStorage({ ytOpenTab: false });
    if (!doOpenTab) return;

    window.open(vid.link);
    document.querySelectorAll('video').forEach(v => v.pause());
  }, 500);
}, 5);