import { getBrowserInstance, nebulavideo } from '../../helpers/sharedExt';

const watchOnNebula = getBrowserInstance().i18n.getMessage('pageWatchOnNebula');
const goChannel = getBrowserInstance().i18n.getMessage('pageGoChannel');
const videoConfidence = getBrowserInstance().i18n.getMessage('pageVideoConfidence');
const searchConfidence = getBrowserInstance().i18n.getMessage('pageSearchConfidence');

export const constructButton = (vid: nebulavideo, before: HTMLElement) => {
  if (!document.querySelector('.watch-on-nebula') || document.querySelector('.watch-on-nebula').children.length === 0) {
    Array.from(document.querySelectorAll<HTMLElement>('.watch-on-nebula')).forEach(n => n.remove());
    // for some reason youtube custom elements clear their inner html in construct, so we have to do it like this
    const wrap = document.createElement('p');
    wrap.style.display = 'none';
    before.before(wrap);
    wrap.className = 'watch-on-nebula';
    const button = wrap.appendChild(document.createElement('span'));
    button.id = 'watch-on-nebula';
    const blink = button.appendChild(document.createElement('a'));
    blink.id = 'link-nebula-watch';
    blink.rel = 'noopener noreferrer';
    blink.textContent = watchOnNebula;
    blink.setAttribute('href', vid.link);
    button.title = generateText(vid);
  } else {
    document.querySelector<HTMLSpanElement>('.watch-on-nebula a').setAttribute('href', vid.link);
    document.querySelector<HTMLButtonElement>('.watch-on-nebula span').title = generateText(vid);
  }
  const b = document.querySelector<HTMLElement>('.watch-on-nebula');
  b.style.display = '';
  return b;
};

const generateText = (vid: nebulavideo) => {
  switch (vid.is) {
    case 'channel':
      return goChannel;
    case 'video':
      return `${videoConfidence}: ${(vid.confidence * 100).toFixed(1)}%`;
    case 'search':
      return `${searchConfidence}: ${(vid.confidence * 100).toFixed(1)}%`;
  }
};