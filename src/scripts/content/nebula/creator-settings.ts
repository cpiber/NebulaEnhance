import iconHide from '../../../icons/hide.svg';
import iconRSS from '../../../icons/nebula/rss.svg';
import iconSettings from '../../../icons/settings.svg';
import iconShow from '../../../icons/show.svg';
import { buildModal } from '../../helpers/modal';
import { getApiBase, getBrowserInstance, getFromStorage, notification, parseTimeString, setCreatorHideAfter, setCreatorHideLonger, toggleHideCreator, toggleHideCreatorPlus } from '../../helpers/sharedExt';

const msg = getBrowserInstance().i18n.getMessage;
const creatorSettings = msg('pageCreatorSettings');
const creatorSettingsShort = msg('pageCreatorSettingsShort');
const rssFeed = msg('pageRssFeed');
const hideCreator = msg('pageHideCreator');
const showCreator = msg('pageShowCreator');
const hideCreatorPlus = msg('pageHideCreatorPlus');
const showCreatorPlus = msg('pageShowCreatorPlus');
const modalTitle = msg('pageCreatorSettings');
const hideAfter = msg('pageHideAfter');
const hideAfterHint = msg('pageHideAfterHint');
const hideLonger = msg('pageHideLonger');
const hideLongerHint = msg('pageHideLongerHint');
const savedtext = msg('optionsSavedNote');

export type CreatorSettings = {
  hideAfter?: string,
  hideIfLonger?: string,
  hideCompletely?: boolean,
  hidePlus?: boolean,
};

export const init = () => {
  document.body.addEventListener('click', click, { capture: true });
  document.body.addEventListener('keyup', change, { capture: true });
  document.querySelectorAll('.creator-settings-modal').forEach(e => e.remove());
};

export const addCreatorSettings = async () => {
  document.querySelectorAll('.enhancer-creator-settings').forEach(e => e.remove());
  if (document.querySelector('a[href^="https://podcasts.watchnebula.com"]')) return; // don't add ourselves to podcast overview pages

  const { rss: loadRss } = await getFromStorage({ rss: false });
  const creator = window.location.pathname.split('/')[1];

  const h1 = document.querySelector('h1');
  const container = h1?.parentElement;
  if (!container) {
    const startWatching = document.querySelector('a[href^="/videos/"] > svg');
    const buttonContainer = startWatching?.parentElement?.parentElement?.nextElementSibling;
    if (!buttonContainer) return;

    const divSettings = buttonContainer.appendChild(document.createElement('div'));
    divSettings.classList.add('enhancer-creator-settings-wrap');
    const bSettings = divSettings.appendChild(document.createElement('button'));
    bSettings.dataset.label = creatorSettingsShort;
    bSettings.ariaLabel = creatorSettings;
    bSettings.innerHTML = iconSettings;
    bSettings.classList.add('enhancer-creator-settings');

    if (loadRss) {
      const divRss = buttonContainer.appendChild(document.createElement('div'));
      divRss.classList.add('enhancer-creator-settings-wrap');
      const rss = divRss.appendChild(document.createElement('a'));
      rss.dataset.label = rssFeed;
      rss.ariaLabel = 'rss';
      rss.innerHTML = iconRSS;
      rss.href = `https://rss.${getApiBase()}/video/channels/${creator}.rss`;
      rss.target = '_blank';
      rss.classList.add('enhancer-rss');
    }
    return;
  }

  const follow = container.lastElementChild.tagName.toLowerCase() === 'button' ? followFromContainer(container) : undefined;

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

const followFromContainer = (container: HTMLElement) => Array.from(container.children).filter(c => !c.classList.contains('enhancer-hideCreator') && !c.classList.contains('enhancer-rss')).pop();

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

  container.classList.toggle('hide-plus', !!settings?.hidePlus);
  const creatorPlusHidden = container.appendChild(document.createElement('div'));
  creatorPlusHidden.appendChild(document.createElement('span')).textContent = hideCreatorPlus;
  creatorPlusHidden.classList.add('enhancer-hideCreatorPlus', 'hide');
  const buttonPlusHidden = creatorPlusHidden.appendChild(document.createElement('button'));
  buttonPlusHidden.innerHTML = iconShow;
  buttonPlusHidden.setAttribute('aria-label', hideCreatorPlus);
  buttonPlusHidden.title = hideCreatorPlus;
  const creatorPlusShown = container.appendChild(document.createElement('div'));
  creatorPlusShown.appendChild(document.createElement('span')).textContent = showCreatorPlus;
  creatorPlusShown.classList.add('enhancer-hideCreatorPlus', 'show');
  const buttonPlusShown = creatorPlusShown.appendChild(document.createElement('button'));
  buttonPlusShown.innerHTML = iconHide;
  buttonPlusShown.setAttribute('aria-label', showCreatorPlus);
  buttonPlusShown.title = showCreatorPlus;

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

export const btnClick = async (creator: string, e: Event) => {
  const target = e.target as HTMLElement;

  const hideCreator = target.closest('.enhancer-hideCreator');
  const hideCreatorPlus = target.closest('.enhancer-hideCreatorPlus');
  const container = document.querySelector('.creator-settings-modal .body > div');
  if (container === null) return;
  if (hideCreator !== null) {
    const hide = container.classList.toggle('hidden');
    await toggleHideCreator(creator, hide);
  }
  if (hideCreatorPlus !== null) {
    const hide = container.classList.toggle('hide-plus');
    await toggleHideCreatorPlus(creator, hide);
  }
};

const click = async (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  if (target.closest('.enhancer-creator-settings') !== null) return show();
  const creator = window.location.pathname.split('/')[1];
  await btnClick(creator, e);
};

export const inputChange = async (creator: string, e: Event) => {
  const target = e.target as HTMLInputElement;

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

const change = async (e: Event) => {
  const creator = window.location.pathname.split('/')[1];
  await inputChange(creator, e);
};