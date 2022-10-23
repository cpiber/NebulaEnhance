/**
 * This file is based on the work of Parker Addison (@parkeraddison)
 * @see https://github.com/parkeraddison/watch-on-nebula/blob/main/extension/scripts/content_script.js
 */

import { BrowserMessage, CancellableRepeatingAction, debounce, getBrowserInstance, getFromStorage, injectFunction, injectFunctionWithReturn, nebulavideo } from '../../helpers/sharedExt';
import { constructButton } from './html';

const optionsDefaults = {
  watchnebula: false,
  ytOpenTab: false,
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
    oldid = null;
    setTimeout(run, 100);
  });

  if (location.host.startsWith('m.')) return console.error('Enhancer for Nebula: YouTube mobile is currently not supported!');

  Array.from(document.querySelectorAll<HTMLElement>('.watch-on-nebula')).forEach(n => n.remove());
  setTimeout(run, 0);

  window.addEventListener('yt-action', (ev: CustomEvent) => {
    if (!ev.detail) return;
    const act = ev.detail.actionName;
    console.dev.debug(`yt action: ${act}`);
    if (![ 'yt-history-load', 'yt-history-pop', 'ytd-log-youthere-nav', 'yt-deactivate-miniplayer-action' ].includes(act) &&
      document.querySelector('.watch-on-nebula')) return;
    console.dev.log(`yt action triggered re-run: ${act}`);
    setTimeout(run, 100);
  });
};

const action = new CancellableRepeatingAction();
let oldid: string = null;
const run = debounce(async () => {
  const remove = () => Array.from(document.querySelectorAll<HTMLElement>('.watch-on-nebula')).forEach(n => n.style.display = 'none');
  if (!location.pathname.startsWith('/watch')) {
    console.dev.log('not a video');
    action.cancel();
    remove();
    oldid = null;
    return;
  }
  action.cancel();
  if (!options.watchnebula) return remove();

  await action.run(async function* () {
    const channelElement = document.querySelector<HTMLAnchorElement>(
      '.ytd-video-owner-renderer + * .yt-formatted-string[href^="/channel/"], .ytd-video-owner-renderer + * .yt-formatted-string[href^="/c/"]');
    const titleElement = document.querySelector<HTMLHeadingElement>('h1.ytd-video-primary-info-renderer');
    const subscribeElement = document.querySelector<HTMLDivElement>('ytd-watch-metadata #subscribe-button, ytd-video-secondary-info-renderer #subscribe-button');
    const idElement = document.querySelector('.ytd-page-manager[video-id]');
    console.dev.debug('Elements', !!channelElement, !!titleElement, !!subscribeElement, !!idElement);
    if (!channelElement || !titleElement || !subscribeElement || !idElement) yield true; // retry
    const setWidth = (w = '') => Array.from(subscribeElement.parentElement.parentElement.children).forEach((n: HTMLElement) => n.style.minWidth = w);

    // accessing custom attributes is not possible from content scripts, so inject this helper
    const channelID = await injectFunctionWithReturn(document.body, () =>
      (document.querySelector('ytd-video-owner-renderer.ytd-video-secondary-info-renderer') as any).__data.data.navigationEndpoint.browseEndpoint.browseId as string);
    const channelName = channelElement.href.split('/').pop();
    const videoTitle = titleElement.textContent;
    const vid: nebulavideo = await getBrowserInstance().runtime.sendMessage({ type: BrowserMessage.GET_VID, channelID, channelName, videoTitle });
    const vidID = idElement.getAttribute('video-id');
    console.debug('got video information',
      '\nchannelID:', channelID, 'channelName:', channelName, 'videoTitle:', videoTitle, 'vidID:', vidID, '(', oldid, ')',
      '\non nebula?', !!vid);

    if (oldid === vidID) yield true; // retry
    oldid = vidID;

    if (!vid) {
      oldid = vidID;
      setWidth();
      return remove();
    }
    console.dev.log('Found video:', vid);

    subscribeElement.before(constructButton(vid));
    const wrap = document.querySelector('ytd-watch-metadata');
    const large = wrap && wrap.hasAttribute('larger-item-wrap'); // this attribute displays two lines (join button)
    setWidth(large ? '500px' : '450px'); // make space for us, more space if youtube wants it already

    const { ytOpenTab: doOpenTab } = options;
    console.dev.debug('Referer:', document.referrer);
    if (document.referrer.match(/https?:\/\/(.+\.)?nebula\.app\/?/) && window.history.length <= 1) return; // prevent open link if via nebula link (any link)
    if (vid.is === 'channel' || !doOpenTab) return;
    yield;

    window.open(vid.link, vidID);
    injectFunction(document.body, () => {
      document.querySelectorAll('video').forEach(v => {
        try {
          v.pause();
          (v.parentElement.parentElement as any).pauseVideo();
        } catch (e) {
          console.dev.error(e);
        }
      });
    });
  }, 500, 10_000);
}, 5);