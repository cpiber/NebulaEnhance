import { clone, videoUrlMatch } from '../helpers/shared';

export const eventPrefix = 'enebula' as const;
export const navigatePrefix = `${eventPrefix}-navigate` as const;
export const loadPrefix = `${eventPrefix}-load` as const;
export const xhrPrefix = `${eventPrefix}-xhr` as const;
export const knownPages = [ 'myshows', 'videos', 'podcasts', 'search', 'account', 'login', 'join', 'terms', 'privacy', 'beta', 'faq', 'suggest', 'jobs' ] as const;

export const knownRegex = new RegExp(`^\\/(${knownPages.join('|')})(?:\\/(.+))?\\/?$`);
export const creatorRegex = /^\/([^/]+)(?:\/(.+))?\/?$/;
export const videoselector = 'a[href^="/videos/"][aria-hidden]';

export const init = () => {
  const origPushState = history.pushState;
  history.pushState = function (data, title, url) {
    origPushState.call(history, data, title, url);
    setTimeout(navigation, 0);
  };
  window.addEventListener('popstate', navigation);
  navigation();

  const xhropen = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function (this: InstanceType<typeof XMLHttpRequest>) {
    this.addEventListener('loadend', () => {
      document.dispatchEvent(new CustomEvent(xhrPrefix, { detail: this }));
    });
    return xhropen.apply(this, arguments as unknown as FnArgs<typeof xhropen>);
  };
};

let currenturl = '';
const navigation = () => {
  if (window.location.href === currenturl)
    return;
  const newpath = window.location.pathname;
  const oldurl = currenturl;
  currenturl = window.location.href;

  const vmatch = newpath.match(videoUrlMatch);
  if (vmatch)
    return naviage('video', oldurl, { video: vmatch[1] });
  if (newpath.match(/^\/$/))
    return naviage('home', oldurl);
  const kmatch = newpath.match(knownRegex);
  if (kmatch)
    return naviage(kmatch[1], oldurl, { more: kmatch[2] });
  const cmatch = newpath.match(creatorRegex);
  return naviage('creator', oldurl, { who: cmatch[1], more: cmatch[2] });
};

let currentDetail: { detail: { page: string, from: string, [key: string]: any } } = null;
let currentlyloading: string = null;
let loadInterval = 0;
const naviage = (page: string, from: string, data: { [key: string]: any } = {}) => {
  console.debug('Navigating to page', page, 'from', from);
  const detail = clone({ detail: { page, from, ...data } });
  currentDetail = detail;
  document.dispatchEvent(new CustomEvent(navigatePrefix, detail));
  document.dispatchEvent(new CustomEvent(`${navigatePrefix}-${page}`, detail));
  currentlyloading = window.location.href;

  window.clearInterval(loadInterval);
  loadInterval = window.setInterval(loading, 500);
};

const loading = () => {
  if (currentlyloading === null || currentlyloading !== window.location.href)
    return window.clearInterval(loadInterval);
  switch (currentDetail.detail.page) {
    case 'video':
      // either video is preset or video can't be played
      if (document.querySelectorAll('h2').length >= 2 && (document.querySelector('video') || document.querySelector('[href="/join/"]')))
        load();
      break;
    case 'creator':
      if (document.querySelectorAll('h2').length >= 2)
        load();
      break;
    case 'videos':
      if (document.querySelectorAll(videoselector).length)
        load();
      break;
    default:
      load();
      break;
  }
};

const load = () => {
  console.debug('Loading finished for page', currentDetail.detail.page);
  document.dispatchEvent(new CustomEvent(loadPrefix, currentDetail));
  document.dispatchEvent(new CustomEvent(`${loadPrefix}-${currentDetail.detail.page}`, currentDetail));
  currentDetail = null;
  currentlyloading = null;
  window.clearInterval(loadInterval);
};