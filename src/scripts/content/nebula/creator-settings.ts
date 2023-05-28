import iconHide from '../../../icons/hide.svg';
import iconRSS from '../../../icons/rss.svg';
import iconSettings from '../../../icons/settings.svg';
import iconShow from '../../../icons/show.svg';
import { buildModal } from '../../helpers/modal';
import { getApiBase, getBrowserInstance, getFromStorage, toggleHideCreator } from '../../helpers/sharedExt';

const msg = getBrowserInstance().i18n.getMessage;
const hideCreator = msg('pageHideCreator');
const showCreator = msg('pageShowCreator');
const modalTitle = msg('pageCreatorSettings');

export const init = () => {
  document.body.addEventListener('click', click, { capture: true });
  document.querySelectorAll('.creator-settings-modal').forEach(e => e.remove());
};

export const addCreatorSettings = async () => {
  document.querySelectorAll('.enhancer-creator-settings').forEach(e => e.remove());
  const h1 = document.querySelector('h1');
  const container = h1?.parentElement;
  if (!container)
    return;
  const follow = container.lastElementChild.tagName.toLowerCase() === 'button' ? followFromContainer(container) : undefined;
  if (follow) container.style.setProperty('--this-bg-color', window.getComputedStyle(follow).backgroundColor);
  if (follow) container.style.setProperty('--this-border', window.getComputedStyle(follow).border);
  const creator = window.location.pathname.split('/')[1];

  const { rss: loadRss } = await getFromStorage({ rss: false });
  if (loadRss) {
    const rss = document.createElement('a');
    if (follow) follow.before(rss); else container.appendChild(rss);
    rss.href = `https://rss.${getApiBase()}/video/channels/${creator}.rss`;
    rss.target = '_blank';
    rss.classList.add('enhancer-rss');
    if (!follow) rss.classList.add('enhancer-hideCreator-pre');
    rss.innerHTML = iconRSS;
  }

  const buttonSettings = container.appendChild(document.createElement('button'));
  buttonSettings.innerHTML = iconSettings;
  buttonSettings.classList.add('enhancer-creator-settings');
};

const followFromContainer = (container: HTMLElement) => Array.from(container.children).filter(c => !c.classList.contains('enhancer-hideCreator')).pop();

const show = () => {
  const container = document.createElement('div');
  const creatorHidden = container.appendChild(document.createElement('div'));
  creatorHidden.appendChild(document.createElement('span')).textContent = hideCreator;
  creatorHidden.classList.add('enhancer-hideCreator', 'hide');
  const buttonHidden = creatorHidden.appendChild(document.createElement('button'));
  buttonHidden.innerHTML = iconShow;
  buttonHidden.setAttribute('aria-label', hideCreator);
  buttonHidden.title = hideCreator;
  const creatorShown = container.appendChild(document.createElement('div'));
  creatorShown.appendChild(document.createElement('span')).textContent = showCreator;
  creatorShown.classList.add('enhancer-hideCreator', 'show');
  const buttonShown = creatorShown.appendChild(document.createElement('button'));
  buttonShown.innerHTML = iconHide;
  buttonShown.setAttribute('aria-label', showCreator);
  buttonShown.title = showCreator;

  buildModal(modalTitle, container, 'creator-settings-modal');
};

const click = async (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  if (target.closest('.enhancer-creator-settings') !== null) return show();

  const hideCreator = target.closest('.enhancer-hideCreator');
  const container = document.querySelector('.creator-settings-modal > div');
  if (hideCreator === null || container === null) return;
  const hide = container.classList.toggle('hidden');
  await toggleHideCreator(window.location.pathname.substring(1), hide);
};