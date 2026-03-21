import { BrowserMessage, debounce, getBrowserInstance, getFromStorage, nebulavideo } from '../../helpers/sharedExt';
import { constructButton } from './html';

const optionsDefaults = {
  ytOpenTab: false,
  ytMuteOnly: false,
  ytReplaceTab: false,
};
let options = { ...optionsDefaults };

export const invidious = async () => {
  options = await getFromStorage(optionsDefaults);
  console.debug('Invidious loaded on', location.hostname);
  getBrowserInstance().storage.onChanged.addListener(changed => {
    Object.keys(options).forEach(prop => {
      if (prop in changed && 'newValue' in changed[prop]) {
        options[prop] = changed[prop].newValue as typeof options[typeof prop];
      }
    });
    console.dev.debug('Reload information', changed);
    setTimeout(run, 100);
  });

  Array.from(document.querySelectorAll<HTMLElement>('.watch-on-nebula')).forEach(n => n.remove());
  setTimeout(run, 0);
};

const remove = () => Array.from(document.querySelectorAll<HTMLElement>('.watch-on-nebula')).forEach(n => n.style.display = 'none');
const findParentLink = (el: HTMLElement) => {
  while (el) {
    if (el.tagName === 'A') return el as HTMLAnchorElement;
    el = el.parentElement;
  }
};
const run = debounce(async () => {
  if (!location.pathname.startsWith('/watch')) {
    console.dev.log('not a video');
    remove();
    return;
  }

  const channelEl = document.getElementById('channel-name');
  const channelNice = channelEl?.textContent.trim();
  const channelLink = findParentLink(channelEl);
  const channelID = channelLink?.href.match(/\/channel\/([^/]+)/)?.[1];
  const titleEl = document.querySelector('#player-container ~ * h1');
  const videoTitle = titleEl?.textContent.trim();
  console.dev.debug('Elements', !!channelEl, !!titleEl, !!channelLink);
  if (!channelEl || !titleEl || !channelLink) return;
  const vidID = location.search.match(/[?&]v=([^&]+)/)?.[1];

  const { res: vid, err }: { res?: nebulavideo, err?: any; } = await getBrowserInstance().runtime.sendMessage({ type: BrowserMessage.GET_VID, channelID, channelName: channelNice, channelNice, videoTitle });
  console.dev.log('got:', vid, err);
  if (!vid) throw new Error(err);
  console.debug('got video information',
    '\nchannelID:', channelID, 'channelName:', channelNice, 'videoTitle:', videoTitle, 'vidID:', vidID,
    '\non nebula?', !!vid);

  if (!vid) return remove();
  console.dev.log('Found video:', vid);

  const watchOnYtEl = document.querySelector<HTMLElement>('#watch-on-youtube');
  if (!watchOnYtEl) return;
  constructButton(vid, watchOnYtEl);

  if ((window.history.state || {})['_enhancer_checked'] === true) return console.debug('Ignoring video since already processed');

  const { ytOpenTab: doOpenTab, ytReplaceTab: replaceTab } = options;
  console.dev.debug('Referer:', document.referrer);
  if (document.referrer.match(/https?:\/\/(.+\.)?nebula\.(app|tv)\/?/) && window.history.length <= 1) return; // prevent open link if via nebula link (any link)
  if (vid.is === 'channel' || !doOpenTab) return;

  /* eslint-disable-next-line camelcase */
  window.history.replaceState({ ...window.history.state, _enhancer_checked: true }, '');

  if (replaceTab) {
    window.location.href = vid.link;
    return;
  }

  window.open(vid.link, vidID);
}, 5);