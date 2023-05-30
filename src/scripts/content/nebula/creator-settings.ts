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

  const after_field = container.appendChild(document.createElement('div'));
  after_field.className = 'enhancer-field';
  const after_title = after_field.appendChild(document.createElement('h3'));
  after_title.className = 'enhancer-field-title i18n';
  after_title.textContent = hideAfter;

  const after_control = after_field.appendChild(document.createElement('div'));
  after_control.className = 'enhancer-control';
  const after_input = after_control.appendChild(document.createElement('input'));
  after_input.className = 'enhancer-text-input is-monospace';
  after_input.id = 'hide-after';
  after_input.value = settings?.hideAfter ?? '';
  after_input.classList.toggle('has-value', !!settings?.hideAfter);
  const after_label = after_control.appendChild(document.createElement('label'));
  after_label.htmlFor = 'hide-after';
  after_label.innerHTML = hideAfterHint;

  const after_warn = container.appendChild(document.createElement('p'));
  after_warn.className = 'warning';

  const longer_field = container.appendChild(document.createElement('div'));
  longer_field.className = 'enhancer-field';
  const longer_title = longer_field.appendChild(document.createElement('h3'));
  longer_title.className = 'enhancer-field-title i18n';
  longer_title.textContent = hideLonger;

  const longer_control = longer_field.appendChild(document.createElement('div'));
  longer_control.className = 'enhancer-control';
  const longer_input = longer_control.appendChild(document.createElement('input'));
  longer_input.className = 'enhancer-text-input is-monospace';
  longer_input.id = 'hide-longer';
  longer_input.value = settings?.hideIfLonger ?? '';
  longer_input.classList.toggle('has-value', !!settings?.hideIfLonger);
  const longer_label = longer_control.appendChild(document.createElement('label'));
  longer_label.htmlFor = 'hide-longer';
  longer_label.innerHTML = hideLongerHint;

  const longer_warn = container.appendChild(document.createElement('p'));
  longer_warn.className = 'warning';

  return buildModal(modalTitle, container, 'creator-settings-modal');
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

  if (target.id === 'hide-after') {
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
  }

  if (target.id === 'hide-longer') {
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
  }
};