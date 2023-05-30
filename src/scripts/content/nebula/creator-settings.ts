import iconHide from '../../../icons/hide.svg';
import iconRSS from '../../../icons/rss.svg';
import iconSettings from '../../../icons/settings.svg';
import iconShow from '../../../icons/show.svg';
import { buildModal } from '../../helpers/modal';
import { getApiBase, getBrowserInstance, getFromStorage, notification, parseTimeString, setCreatorHideAfter, setCreatorHideLonger, toggleHideCreator } from '../../helpers/sharedExt';

const msg = getBrowserInstance().i18n.getMessage;
const hideCreator = msg('pageHideCreator');
const showCreator = msg('pageShowCreator');
const modalTitle = msg('pageCreatorSettings');
const hideAfter = msg('pageHideAfter');
const hideAfterHint = msg('pageHideAfterHint');
const hideLonger = msg('pageHideLonger');
const hideLongerHint = msg('pageHideLongerHint');
const savedtext = getBrowserInstance().i18n.getMessage('optionsSavedNote');

export type CreatorSettings = {
  hideAfter?: string,
  hideIfLonger?: string,
  hideCompletely?: boolean,
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
  const link = document.querySelector('a');
  if (link) container.style.setProperty('--this-bg-color', window.getComputedStyle(link).color);
  if (link) container.style.setProperty('--this-border', window.getComputedStyle(link).color);
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
  return showSettingsModal(creator);
};

export const showSettingsModal = async (creator: string) => {
  const { creatorSettings: { [creator]: settings } } = await getFromStorage({ creatorSettings: {} as Record<string, CreatorSettings> });

  const container = document.createElement('div');
  container.classList.toggle('hidden', !!settings?.hideCompletely);
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

  const afterField = container.appendChild(document.createElement('div'));
  afterField.className = 'enhancer-field';
  const afterTitle = afterField.appendChild(document.createElement('h3'));
  afterTitle.className = 'enhancer-field-title i18n';
  afterTitle.textContent = hideAfter;
  afterTitle.title = hideAfterHint.replace(/<\/?\w+>/g, '');

  const afterControl = afterField.appendChild(document.createElement('div'));
  afterControl.className = 'enhancer-control';
  const afterInput = afterControl.appendChild(document.createElement('input'));
  afterInput.className = 'enhancer-text-input is-monospace';
  afterInput.id = 'hide-after';
  afterInput.value = settings?.hideAfter ?? '';
  afterInput.classList.toggle('has-value', !!settings?.hideAfter);
  const afterLabel = afterControl.appendChild(document.createElement('label'));
  afterLabel.htmlFor = 'hide-after';
  afterLabel.innerHTML = hideAfterHint;

  const afterWarn = container.appendChild(document.createElement('p'));
  afterWarn.className = 'warning';

  const longerField = container.appendChild(document.createElement('div'));
  longerField.className = 'enhancer-field';
  const longerTitle = longerField.appendChild(document.createElement('h3'));
  longerTitle.className = 'enhancer-field-title i18n';
  longerTitle.textContent = hideLonger;
  longerTitle.title = hideLongerHint.replace(/<\/?\w+>/g, '');

  const longerControl = longerField.appendChild(document.createElement('div'));
  longerControl.className = 'enhancer-control';
  const longerInput = longerControl.appendChild(document.createElement('input'));
  longerInput.className = 'enhancer-text-input is-monospace';
  longerInput.id = 'hide-longer';
  longerInput.value = settings?.hideIfLonger ?? '';
  longerInput.classList.toggle('has-value', !!settings?.hideIfLonger);
  const longerLabel = longerControl.appendChild(document.createElement('label'));
  longerLabel.htmlFor = 'hide-longer';
  longerLabel.innerHTML = hideLongerHint;

  const longerWarn = container.appendChild(document.createElement('p'));
  longerWarn.className = 'warning';

  return buildModal(modalTitle, container, 'creator-settings-modal');
};

const click = async (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  if (target.closest('.enhancer-creator-settings') !== null) return show();
  const creator = window.location.pathname.split('/')[1];

  const hideCreator = target.closest('.enhancer-hideCreator');
  const container = document.querySelector('.creator-settings-modal .body > div');
  if (hideCreator === null || container === null) return;
  const hide = container.classList.toggle('hidden');
  await toggleHideCreator(creator, hide);
};

const change = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const creator = window.location.pathname.split('/')[1];

  if (target.id === 'hide-after') {
    target.classList.toggle('has-value', !!target.value);
    const warning = target.closest('.enhancer-field').nextElementSibling;
    try {
      warning.textContent = '';
      parseTimeString(target.value);
      await setCreatorHideAfter(creator, target.value);
      notification(savedtext);
    } catch (ex) {
      warning.textContent = ex;
    }
  }

  if (target.id === 'hide-longer') {
    target.classList.toggle('has-value', !!target.value);
    const warning = target.closest('.enhancer-field').nextElementSibling;
    try {
      warning.textContent = '';
      parseTimeString(target.value);
      await setCreatorHideLonger(creator, target.value);
      notification(savedtext);
    } catch (ex) {
      warning.textContent = ex;
    }
  }
};