import type { CreatorSettings } from '../content/nebula/creator-settings';
import { Message, clone, getFromStorage, onStorageChange, parseTimeString, sendMessage, videoUrlMatch } from './sharedpage';
import { collectEngagement, filterFeatured, filterVideos } from './xhrfilters';

export const eventPrefix = 'enebula' as const;
export const navigatePrefix = `${eventPrefix}-navigate` as const;
export const loadPrefix = `${eventPrefix}-load` as const;
export const xhrPrefix = `${eventPrefix}-xhr` as const;
export const knownPages = [ 'myshows', 'videos', 'podcasts', 'classes', 'search', 'account', 'login', 'join', 'terms', 'privacy', 'beta', 'faq', 'suggest', 'jobs', 'settings' ] as const;

export const knownRegex = new RegExp(`^\\/(${knownPages.join('|')})(?:\\/(.+))?\\/?$`);
export const creatorRegex = /^\/([^/]+)(?:\/(.+))?\/?$/;
export const videoselector = 'a[href^="/videos/"][aria-hidden]';

const optionsDefaults = {
  hideVideosEnabled: false,
  hideVideosPerc: 80,
  creatorSettings: {} as Record<string, CreatorSettings>,
  creatorHideAfter: {} as Record<string, number>,
  creatorHideIfLonger: {} as Record<string, number>,
};
let options = { ...optionsDefaults };

export const init = async () => {
  const pushstate = history.pushState;
  history.pushState = function (data, title, url) {
    pushstate.call(history, data, title, url);
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
  const xhrresponseget = Object.getOwnPropertyDescriptor(window.XMLHttpRequest.prototype, 'responseText');
  Object.defineProperty(window.XMLHttpRequest.prototype, 'responseText', {
    ...xhrresponseget,
    get() {
      let responseText: string = xhrresponseget.get.apply(this);
      const { creatorSettings, hideVideosEnabled, hideVideosPerc, creatorHideAfter, creatorHideIfLonger } = options;
      const hiddenCreators = Object.keys(creatorSettings).filter(c => creatorSettings[c].hideCompletely);
      collectEngagement(this, responseText);
      responseText = filterVideos(this, responseText, hiddenCreators, creatorHideAfter, creatorHideIfLonger, hideVideosEnabled ? hideVideosPerc : undefined);
      responseText = filterFeatured(this, responseText, hiddenCreators, creatorHideAfter, creatorHideIfLonger, hideVideosEnabled ? hideVideosPerc : undefined);
      return responseText;
    },
  });

  const localeTimeMappings = await sendMessage(Message.GET_MESSAGE, { message: 'miscTimeLocaleMappings' });
  const transformCreatorSettings = () => {
    options.creatorHideAfter = {};
    options.creatorHideIfLonger = {};
    for (const prop in options.creatorSettings) {
      if (options.creatorSettings[prop].hideAfter) {
        options.creatorHideAfter[prop] = parseTimeString(options.creatorSettings[prop].hideAfter, 'Time string contains invalid elements', localeTimeMappings, unit => `Invalid unit ${unit}`);
      }
      if (options.creatorSettings[prop].hideIfLonger) {
        options.creatorHideIfLonger[prop] = parseTimeString(options.creatorSettings[prop].hideIfLonger, 'Time string contains invalid elements', localeTimeMappings, unit => `Invalid unit ${unit}`);
      }
    }
  };

  options = await getFromStorage(optionsDefaults);
  transformCreatorSettings();

  onStorageChange(changed => {
    Object.keys(options).forEach(prop => {
      if (prop in changed && 'newValue' in changed[prop]) {
        /* @ts-expect-error for some reason, options[prop] narrows to never... */
        options[prop] = changed[prop].newValue as typeof options[typeof prop];
        if (prop === 'creatorSettings') transformCreatorSettings();
      }
    });
  });
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

let currentDetail: { detail: { page: string, from: string, [key: string]: any; }; } = null;
let currentlyloading: string = null;
let loadInterval = 0;
const naviage = (page: string, from: string, data: { [key: string]: any; } = {}) => {
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
      if (document.querySelectorAll('h1, h2').length >= 2 && (document.querySelector('video') || document.querySelector('[href="/join/"]')))
        load();
      break;
    case 'creator':
      if (document.querySelectorAll('h1, h2').length >= 2)
        load();
      break;
    case 'videos':
      if (document.querySelector(videoselector))
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