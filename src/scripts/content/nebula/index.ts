import iconHide from '../../../icons/hide.svg';
import iconRSS from '../../../icons/rss.svg';
import iconShow from '../../../icons/show.svg';
import iconWatchLater from '../../../icons/watchlater.svg';
import { enqueueChannelVideos } from '../../helpers/api';
import { creatorLink, isWatchProgress, queueBottonLocation, watchLaterLocation, watchProgressLocation } from '../../helpers/locations';
import { BrowserMessage, calcOuterBounds, clone, debounce, devClone, devExport, getBase, getBrowserInstance, getFromStorage, injectScript, isMobile, isVideoListPage, isVideoPage, setToStorage, toggleHideCreator, videoUrlMatch, ytvideo } from '../../helpers/sharedExt';
import { creatorRegex, loadPrefix, videoselector, xhrPrefix } from '../../page/dispatcher';
import { Queue } from '../queue';
import { handle } from './message';

const msg = getBrowserInstance().i18n.getMessage;
const addToQueue = msg('pageAddToQueue');
const hideCreator = msg('pageHideCreator');
const showCreator = msg('pageShowCreator');

const optionsDefaults = {
  youtube: false,
  theme: '',
  customScriptPage: '',
  hiddenCreators: [] as string[],
  hideVideosEnabled: false,
  hideVideosPerc: 80,
  visitedColor: '',
};
let options = { ...optionsDefaults };

export const nebula = async () => {
  const {
    youtube,
    theme,
    customScriptPage,
    hiddenCreators,
    hideVideosEnabled,
    hideVideosPerc,
    visitedColor,
  } = options = await getFromStorage(optionsDefaults);

  console.debug('Youtube:', youtube, 'Theme:', theme, 'visitedColor:', visitedColor,
    '\nHiding', hiddenCreators.length, 'creators', '\tvideos?', hideVideosEnabled, 'with perc watched:', hideVideosPerc);

  if (!theme) try {
    const newtheme = JSON.parse(localStorage.getItem('colorSchemeSetting'));
    console.debug('Detected theme', newtheme);
    setToStorage({ theme: newtheme });
  } catch { }

  // attach listeners
  window.addEventListener('message', handle);
  window.addEventListener('hashchange', hashChange);
  document.addEventListener(`${loadPrefix}-video`, maybeLoadComments);
  document.addEventListener(`${loadPrefix}-creator`, createLinkForAll);
  document.addEventListener(`${loadPrefix}-creator`, insertHideButton);
  document.addEventListener(loadPrefix, doVideoActions);
  document.addEventListener(xhrPrefix, doVideoActions);
  document.body.addEventListener('mouseover', hover);
  document.body.addEventListener('click', click, { capture: true });
  doVideoActions();

  // inject web content script
  await injectScript(getBrowserInstance().runtime.getURL('/scripts/player.js'), document.body);

  // start up own content
  const queue = Queue.get(); // initialize
  await hashChange();
  await Queue.get().restoreStorage();
  await maybeLoadComments();

  // inject custom script (if available)
  if (customScriptPage)
    await injectScript(document.body, customScriptPage);
  setStyles();

  document.body.classList.add('enhancer-initialized');

  getBrowserInstance().storage.onChanged.addListener(changed => {
    Object.keys(options).forEach(prop => {
      if (prop in changed && 'newValue' in changed[prop]) {
        /* @ts-expect-error for some reason, options[prop] narrows to never... */
        options[prop] = changed[prop].newValue as typeof options[typeof prop];
      }
    });
    doVideoActions();
    setStyles();
    maybeLoadComments();
  });

  // debug code
  // rollup optimizes everything that relies on __DEV__ out
  // but because of potential side-effects in queue[key] and v.bind(queue),
  // we need to explicitly guard here
  if (!__DEV__) return;
  devClone('queue', {});
  Object.keys(queue).forEach(key => {
    const v = queue[key];
    const str = Object.prototype.toString.call(v);
    if (typeof v === 'function') devClone(key, v.bind(queue), 'queue');
    else if (str !== '[object Object]') devExport(key, () => queue[key], 'queue');
    else devExport(key, () => clone(queue[key]), 'queue');
  });
};

const setStyles = () => {
  const { visitedColor } = options;
  document.getElementById('enhancer-styles')?.remove();

  // set hidden creator overlay content from translation
  const s = document.createElement('style');
  s.id = 'enhancer-styles';
  s.textContent = `.enhancer-hiddenVideo::after { content: ${JSON.stringify(msg('pageCreatorHidden'))}; }`;
  const c = visitedColor.split(';')[0];
  if (c) s.textContent += `\n:root { --visited-color: ${c}; }\na[href^='/videos/']:visited > div > * /* video link */ { color: var(--visited-color); }`;
  document.head.appendChild(s);
};

const doVideoActions = debounce(() => {
  // add links on mobile to substitute hover
  if (isMobile())
    Array.from(document.querySelectorAll<HTMLImageElement>(`${videoselector} img`)).forEach(createLink);
  // hide creators
  if (isVideoListPage())
    Array.from(document.querySelectorAll<HTMLElement>(videoselector)).forEach(el =>
      hideVideo(el, options.hiddenCreators, options.hideVideosEnabled, options.hideVideosPerc));
}, 500);

const videoHoverLink = (e: HTMLElement) => {
  // check if element is the image in a video link
  const outer = e.closest('[data-context-menu-hover-trigger]');
  if (outer === null)
    return null;
  const link = outer.firstElementChild;
  if (!link.matches(videoselector))
    return null;
  return link;
};
const hover = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'TIME' && target.hasAttribute('datetime')) return timeHover(target as HTMLTimeElement);
  const link = videoHoverLink(target);
  if (link === null)
    return;
  createLink(link.querySelector('img'));
};
const createLink = (img: HTMLImageElement): void => {
  if (!img || queueBottonLocation(img).querySelector('.enhancer-queueButton') !== null)
    return; // queue button exists
  // create queue button
  const later = document.createElement('div');
  const watch = watchLaterLocation(img);
  const inner = watch?.firstElementChild;
  const text = inner?.lastElementChild;
  if (!watch || !inner || !text)
    return console.dev.error('Expected nebula watch-later button', img), undefined;
  later.innerHTML = `<div class="${inner.className}"><div class="${text.className} text">${addToQueue}</div>${iconWatchLater}</div>`;
  later.className = `${watch.className} enhancer-queueButton`;
  watch.after(later);
  watch.classList.add('nebula-watch-later');
};
const timeHover = (e: HTMLTimeElement) => {
  const time = new Date(e.dateTime).toLocaleString().replace(/(\d{1,2}:\d{2}):\d{2}/, '$1'); // remove seconds
  if (!time || isNaN(new Date(e.dateTime).getTime())) return;
  const { rect, offset } = calcOuterBounds(e);
  const el = e.querySelector<HTMLSpanElement>('.enhancer-datetime') || e.appendChild(document.createElement('span'));
  el.textContent = time;
  el.style.left = `${rect.width / 2 - offset}px`;
  el.classList.add('enhancer-datetime');
};

const click = async (e: MouseEvent) => {
  const q = Queue.get();
  const target = e.target as HTMLElement;

  if (target.closest('main [role="listbox"]') && location.pathname.startsWith('/settings/preferences'))
    return changeTheme(e);

  const addAll = target.closest('.enhancer-queueButtonAll');
  if (addAll !== null) {
    e.preventDefault();
    const creator = window.location.pathname.match(creatorRegex)[1];
    document.body.style.cursor = 'wait';
    (document.activeElement as HTMLElement).blur();
    // Queue.get().set(await getChannelVideos(creator));
    await enqueueChannelVideos(Queue.get(), creator);
    document.body.style.cursor = '';
    return;
  }

  const hideCreator = target.closest('.enhancer-hideCreator');
  if (hideCreator !== null) {
    const h2 = hideCreator.parentElement?.children[1];
    console.assert(h2.tagName.toLowerCase() === 'h2', 'Assumed tag of queried element to be `h2`, got `%s`', h2.tagName.toLowerCase());
    const hide = h2.classList.toggle('hidden');
    options.hiddenCreators = await toggleHideCreator(window.location.pathname.substring(1), hide);
    return;
  }

  const later = target.closest('.enhancer-queueButton');
  const link = target.closest<HTMLAnchorElement>(videoselector);
  if (link === null)
    return;
  const name = link.getAttribute('href').substring(8);
  // extract and store information on video
  await q.addToStore(name, link);
  // no queue and video clicked
  if (q.isEmpty() && later === null)
    return;
  // always prevent going to video
  e.preventDefault();
  if (later !== null) {
    // queue button clicked
    q.enqueue(name);
  } else {
    // video clicked
    q.enqueueNow(name);
    q.gotoNext();
  }
};

const hashChange = async () => {
  const current = window.location.pathname.match(videoUrlMatch);
  const hash = window.location.hash.match(/^#([A-Za-z0-9\-_]+(?:,[A-Za-z0-9\-_]+)*)$/);
  if (!hash)
    return; // invalid video list
  // extract comma separated list of friendly-names from hash
  const q = hash[1].split(',');
  const cur = current ? current[1] : undefined;
  console.dev.debug('queue:', q, '\ncurrent:', cur);
  await Queue.get().set(q, cur);
  console.debug('Queue: loaded from hash');
};

const maybeLoadComments = () => {
  if (options.youtube && isVideoPage())
    return loadComments();
};
const loadComments = async () => {
  const h2 = Array.from(document.querySelectorAll('h1, h2'));
  if (h2.length < 2) return;
  const title = h2[0].textContent;
  const creator = h2[1].textContent;
  if (!title || !creator) return;
  const nebula = (h2[1].parentElement as HTMLAnchorElement).getAttribute('href').split('/')[1];
  const e = h2[0].nextElementSibling;
  const time = e?.children[e?.childElementCount - 2];
  if (!e || !time || e.querySelector('.enhancer-yt, .enhancer-yt-err'))
    return; // already requested
  console.debug(`Requesting '${title}' by ${creator} (${nebula})`);

  try {
    const vid: ytvideo = await getBrowserInstance().runtime.sendMessage({ type: BrowserMessage.GET_YTID, creator, title, nebula });
    console.debug('Found video:', vid);
    const v = document.createElement('span');
    v.classList.add('enhancer-yt');
    const a = document.createElement('a');
    a.href = `https://youtu.be/${vid.video}`;
    a.target = '_blank';
    a.textContent = a.href;
    v.append(a, ` (${(vid.confidence * 100).toFixed(1)}%)`);
    const dot = document.createElement('span');
    dot.appendChild(document.createTextNode('•'));
    const v2 = v.cloneNode(true) as HTMLElement;
    v2.classList.add('enhancer-yt-outside', ...Array.from(time.parentElement.classList));
    time.parentElement.after(v2);
    dot.classList.add('enhancer-yt-inside', 'dot');
    v.classList.add('enhancer-yt-inside');
    time.after(dot, v);
  } catch (err) {
    console.debug('Request failed:', err);
    console.dev.error(err);
    const er = document.createElement('span');
    er.classList.add('enhancer-yt-err');
    er.textContent = `${err}`;
    time.after(er);
  }
  console.debug('Loading comments done.');
};

const createLinkForAll = () => {
  document.querySelector('.enhancer-queueButtonAll')?.remove();
  const container = document.querySelector('main > p + div');
  if (!container)
    return;

  const link = !container.children.length ? document.createElement('a') : container.children[0].cloneNode(true) as HTMLAnchorElement;
  link.style.color = link.querySelector('svg')?.getAttribute('fill');
  link.innerHTML = iconWatchLater;
  link.href = '#';
  link.classList.add('enhancer-queueButton', 'enhancer-queueButtonAll');
  container.appendChild(link);
};

const insertHideButton = async () => {
  document.querySelectorAll('.enhancer-hideCreator').forEach(e => e.remove());
  const h2 = document.querySelector('h2');
  const container = h2?.parentElement;
  if (!container)
    return;
  const follow = handleFollowSpacing(container);
  if (follow) container.style.setProperty('--this-bg-color', window.getComputedStyle(follow).backgroundColor);
  if (follow) container.style.setProperty('--this-border', window.getComputedStyle(follow).border);
  const creator = window.location.pathname.split('/')[1];

  const { rss: loadRss } = await getFromStorage({ rss: false });
  if (loadRss) {
    const rss = document.createElement('a');
    if (follow) follow.before(rss); else container.appendChild(rss);
    rss.href = `https://rss.${getBase()}/video/channels/${creator}.rss`;
    rss.target = '_blank';
    rss.classList.add('enhancer-rss');
    if (!follow) rss.classList.add('enhancer-hideCreator-pre');
    rss.innerHTML = iconRSS;
  }

  const buttonHidden = container.appendChild(document.createElement('button'));
  buttonHidden.innerHTML = iconShow;
  buttonHidden.classList.add('enhancer-hideCreator', 'hide');
  buttonHidden.setAttribute('aria-label', hideCreator);
  buttonHidden.title = hideCreator;
  const buttonShown = container.appendChild(document.createElement('button'));
  buttonShown.innerHTML = iconHide;
  buttonShown.classList.add('enhancer-hideCreator', 'show');
  buttonShown.setAttribute('aria-label', showCreator);
  buttonShown.title = showCreator;
  h2.classList.toggle('hidden', options.hiddenCreators.includes(creator));
};

const followFromContainer = (container: HTMLElement) => Array.from(container.children).filter(c => !c.classList.contains('enhancer-hideCreator')).pop();
const handleFollowSpacing = (container: HTMLElement) => {
  const follow = container.lastElementChild.tagName.toLowerCase() === 'button' ? followFromContainer(container) : undefined;
  if (!follow) return;
  const inner = () => setTimeout(handleFollowSpacing, 0, container);
  follow.classList.add('enhancer-hideCreator-pre');
  follow.removeEventListener('click', inner);
  follow.addEventListener('click', inner);
  return follow;
};

const changeTheme = (e: MouseEvent) => {
  const theme = (e.target as HTMLElement).dataset.value.toLowerCase();
  console.debug('Saving theme', theme);
  setToStorage({ theme });
};

const hideVideo = (el: HTMLElement, hiddenCreators: string[], hideWatched: boolean, hidePerc: number) => {
  const creator = creatorLink(el)?.split('/')?.[1];
  let hide = false;
  if (creator && hiddenCreators.indexOf(creator) !== -1) {
    console.debug('Hiding video by creator', creator, `https://${getBase()}/${creator}`);
    hide = true;
  }
  const watchProgress = watchProgressLocation(el);
  if (hideWatched && watchProgress && isWatchProgress(watchProgress)) {
    const ww = getComputedStyle(watchProgress.children[0]).width;
    const pw = getComputedStyle(watchProgress).width;
    const percent = (+ww.slice(0, -2)) / (+pw.slice(0, -2)) * 100;
    if (percent > hidePerc) {
      console.debug('Hiding video above watch percent', hidePerc, `(was ${percent})`);
      hide = true;
    }
  }
  if (!hide) return;
  if (el.parentElement.parentElement.previousElementSibling?.tagName?.toLowerCase() !== 'img') el.parentElement.remove();
  else el.parentElement.classList.add('enhancer-hiddenVideo');
};
