import iconHide from '../../../icons/hide.svg';
import iconRSS from '../../../icons/rss.svg';
import iconSettings from '../../../icons/settings.svg';
import iconShow from '../../../icons/show.svg';
import { buildModal } from '../../helpers/modal';
import { getApiBase, getBrowserInstance, getFromStorage, notification, parseTimeString, setCreatorHideAfter, toggleHideCreator } from '../../helpers/sharedExt';

const msg = getBrowserInstance().i18n.getMessage;
const hideCreator = msg('pageHideCreator');
const showCreator = msg('pageShowCreator');
const modalTitle = msg('pageCreatorSettings');
const hideAfter = msg('pageHideAfter');
const hideAfterHint = msg('pageHideAfterHint');
const savedtext = getBrowserInstance().i18n.getMessage('optionsSavedNote');

export type CreatorSettings = {
  hideAfter?: string,
};

export const init = () => {
  document.body.addEventListener('click', click, { capture: true });
  document.body.addEventListener('keyup', change, { capture: true });
  document.querySelectorAll('.creator-settings-modal').forEach(e => e.remove());
};

export const addCreatorSettings = async () => {
  document.querySelectorAll('.enhancer-creator-settings').forEach(e => e.remove());
  const h1 = document.querySelector('h1');
  const container = h1?.parentElement;
  if (!container) return;
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

const show = async () => {
  const creator = window.location.pathname.split('/')[1];
  const { creatorSettings: { [creator]: settings }, hiddenCreators } = await getFromStorage({ creatorSettings: {} as Record<string, CreatorSettings>, hiddenCreators: [] as string[] });

  const container = document.createElement('div');
  container.classList.toggle('hidden', hiddenCreators.includes(creator));
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

  container.appendChild(document.createElement('br'));

  const field = container.appendChild(document.createElement('div'));
  field.className = 'enhancer-field';
  const title = field.appendChild(document.createElement('h3'));
  title.className = 'enhancer-field-title i18n';
  title.textContent = hideAfter;

  const control = field.appendChild(document.createElement('div'));
  control.className = 'enhancer-control';
  const input = control.appendChild(document.createElement('input'));
  input.className = 'enhancer-text-input is-monospace';
  input.id = 'hide-after';
  input.value = settings?.hideAfter ?? '';
  input.classList.toggle('has-value', !!settings?.hideAfter);
  const label = control.appendChild(document.createElement('label'));
  label.htmlFor = 'hide-after';
  label.innerHTML = hideAfterHint;

  const warn = container.appendChild(document.createElement('p'));
  warn.className = 'warning';

  buildModal(modalTitle, container, 'creator-settings-modal');
};

const click = async (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  if (target.closest('.enhancer-creator-settings') !== null) return show();

  const hideCreator = target.closest('.enhancer-hideCreator');
  const container = document.querySelector('.creator-settings-modal .body > div');
  if (hideCreator === null || container === null) return;
  const hide = container.classList.toggle('hidden');
  await toggleHideCreator(window.location.pathname.substring(1), hide);
};

const change = async (e: Event) => {
  const target = e.target as HTMLInputElement;

  if (target.id !== 'hide-after') return;
  target.classList.toggle('has-value', !!target.value);
  const warning = target.closest('.enhancer-field').nextElementSibling;
  try {
    warning.textContent = '';
    parseTimeString(target.value);
    await setCreatorHideAfter(window.location.pathname.substring(1), target.value);
    notification(savedtext);
  } catch (ex) {
    warning.textContent = ex;
  }
};