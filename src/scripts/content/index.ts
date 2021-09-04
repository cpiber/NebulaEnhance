import iconWatchLater from '../../icons/watchlater.svg';
import { durationLocation, queueBottonLocation } from '../helpers/locations';
import { BrowserMessage, QUEUE_KEY, getBrowserInstance, injectScript, isMobile, isVideoPage, mutation, videoUrlMatch, ytvideo } from '../helpers/sharedExt';
import { creatorRegex, loadPrefix } from '../page/dispatcher';
import { enqueueChannelVideos } from './api';
import { handle } from './message';
import { Queue } from './queue';

const videoselector = 'a[href^="/videos/"]';
const addToQueue = getBrowserInstance().i18n.getMessage('pageAddToQueue');

function getFromStorage<T extends { [key: string]: any }>(key: T): Promise<T>;
function getFromStorage(key: string | string[] | { [key: string]: any }) {
  return getBrowserInstance().storage.local.get(key);
}

export const nebula = async () => {
  const { youtube, customScriptPage } = await getFromStorage({ youtube: false, customScriptPage: '' });
  console.debug('Youtube:', youtube);

  // attach listeners
  window.addEventListener('message', handle);
  window.addEventListener('hashchange', hashChange);
  document.addEventListener(`${loadPrefix}-video`, maybeLoadComments.bind(null, youtube));
  document.addEventListener(`${loadPrefix}-creator`, createLinkForAll);
  document.body.addEventListener('mouseover', hover);
  document.body.addEventListener('click', click);

  // inject web content script
  await injectScript(getBrowserInstance().runtime.getURL('/scripts/player.js'), document.body);

  // start up own content
  Queue.get(); // initialize
  await hashChange();
  await loadQueueFromStorage();
  await maybeLoadComments(youtube);

  const cb = mutation(() => {
    // substitute hover listener
    if (isMobile())
      Array.from(document.querySelectorAll<HTMLImageElement>(`${videoselector} img`)).forEach(createLink);
  }, 1000);
  const m = new MutationObserver(cb);
  m.observe(document.querySelector('#root'), { subtree: true, childList: true });
  cb();

  // inject custom script (if available)
  if (customScriptPage)
    await injectScript(document.body, customScriptPage);
};

const imgLink = (e: HTMLElement) => {
  // check if element is the image in a video link
  if (e.tagName !== 'IMG')
    return null;
  const link = e.closest(videoselector);
  if (link === null)
    return null;
  return link;
};
const hover = (e: MouseEvent) => {
  const link = imgLink(e.target as HTMLElement);
  if (link === null)
    return;
  createLink(e.target as HTMLImageElement);
};
const createLink = (img: HTMLImageElement) => {
  if (queueBottonLocation(img).querySelector('.enhancer-queueButton') !== null)
    return; // queue button exists
  // create queue button
  const later = document.createElement('div');
  const time = durationLocation(img);
  if (!time || !time.querySelector('span'))
    return; // ignore profile pic
  later.innerHTML = `<span class="${time.querySelector('span')?.className}">${addToQueue}</span>${iconWatchLater}`;
  later.className = `${time?.className} enhancer-queueButton`;
  queueBottonLocation(img).appendChild(later);
};

const click = async (e: MouseEvent) => {
  const q = Queue.get();
  const target = e.target as HTMLElement;

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

  const later = target.closest('.enhancer-queueButton');
  const link = target.closest<HTMLAnchorElement>(videoselector);
  if (link === null)
    return;
  const name = link.getAttribute('href').substr(8);
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
  await Queue.get().set(q, current ? current[1] : undefined);
  console.debug('Queue: loaded from hash');
};

const loadQueueFromStorage = async () => {
  const data = window.localStorage.getItem(QUEUE_KEY);
  if (data === null) return; // nothing in the storage
  if (!Queue.get().isEmpty())
    return console.debug('Queue: ignoring localStorage');
  const parsed = JSON.parse(data);
  if (parsed.position + 1 >= parsed.queue.length)
    return console.debug('Queue: ignoring queue on last video');
  await Queue.get().set(parsed.queue, +parsed.position);
  console.debug(`Queue: loaded from localStorage (${parsed.queue.length}/${parsed.position})`);
};

const maybeLoadComments = (yt: boolean) => {
  if (yt && isVideoPage())
    return loadComments();
};
const loadComments = async () => {
  const h2 = Array.from(document.querySelectorAll('h2'));
  if (h2.length < 2) return;
  const title = h2[0].textContent;
  const creator = h2[1].textContent;
  if (!title || !creator) return;
  const e = h2[0].nextElementSibling;
  if (!e || e.querySelector('.enhancer-yt, .enhancer-yt-err'))
    return; // already requested
  console.debug(`Requesting '${title}' by ${creator}`);

  try {
    const vid: ytvideo = await getBrowserInstance().runtime.sendMessage({ type: BrowserMessage.GET_YTID, creator, title });
    const v = document.createElement('span');
    v.classList.add('enhancer-yt');
    const a = document.createElement('a');
    a.href = `https://youtu.be/${vid.video}`;
    a.target = '_blank';
    a.textContent = a.href;
    v.append(a, ` (${(vid.confidence * 100).toFixed(1)}%)`);
    e.append(e.querySelector('span[class]')?.cloneNode(true), v); // dot
  } catch (err) {
    console.error(err);
    const er = document.createElement('span');
    er.classList.add('enhancer-yt-err');
    er.textContent = `${err}`;
    e.append(er);
  }
  console.debug('Loading comments done.');
};

const createLinkForAll = () => {
  document.querySelector('.enhancer-queueButtonAll')?.remove();
  const container = document.querySelector('picture + div > p + div');
  if (!container)
    return;

  const link = !container.children.length ? document.createElement('a') : container.children[0].cloneNode(true) as HTMLAnchorElement;
  link.style.color = link.querySelector('svg')?.getAttribute('fill');
  link.innerHTML = iconWatchLater;
  link.href = '#';
  link.classList.add('enhancer-queueButton', 'enhancer-queueButtonAll');
  container.appendChild(link);
};
