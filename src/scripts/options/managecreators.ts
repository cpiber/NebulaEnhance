import iconSettings from '../../icons/settings.svg';
import { CreatorSettings, showSettingsModal } from '../content/nebula/creator-settings';
import { getChannel } from '../helpers/api';
import { getBrowserInstance, getFromStorage, parseTimeString, setCreatorHideAfter, setCreatorHideLonger, toggleHideCreator } from '../helpers/sharedExt';
import { buildModal, withLoader } from './modal';

const msg = getBrowserInstance().i18n.getMessage;
const textSettings = JSON.parse(msg('optionsCreatorTexts'));

const settingsModal = async (channel: string) => {
  const cl = click.bind(null, channel);
  const ch = change.bind(null, channel);
  document.addEventListener('click', cl);
  document.addEventListener('keyup', ch);
  await showSettingsModal(channel);
  document.removeEventListener('click', cl);
  document.removeEventListener('keyup', ch);
  showManageCreators();
};

const buildCreator = (creatorSettings: Record<string, CreatorSettings>, channel: Partial<Nebula.Channel>) => {
  const { [channel.slug]: s } = creatorSettings;
  const el = document.createElement('div');
  el.className = 'hidden-creator';
  const h = el.appendChild(document.createElement('h2'));
  const avatar = channel.assets.avatar[32] || channel.assets.avatar[Object.keys(channel.assets.avatar)[0]];
  const img = h.appendChild(document.createElement('img'));
  img.src = avatar?.original;
  img.alt = channel.title;
  img.className = 'avatar';
  const link = h.appendChild(document.createElement('a'));
  link.href = channel.share_url;
  link.target = '_blank';
  link.innerText = channel.title;
  link.title = channel.slug;
  const details = h.appendChild(document.createElement('span'));
  details.className = 'details';
  details.textContent = `(${textSettings.prefix} `;
  if (s.hideCompletely) details.textContent += textSettings.completely;
  else {
    const parts = [];
    if (s.hideAfter) parts.push(textSettings.after.replace(/\{\}/g, s.hideAfter));
    if (s.hideIfLonger) parts.push(textSettings.longer.replace(/\{\}/g, s.hideIfLonger));
    console.assert(parts.length > 0, 'Expected at least one setting');
    details.textContent += parts.join(textSettings.separator);
  }
  details.textContent += ')';
  const buttonSettings = h.appendChild(document.createElement('button'));
  buttonSettings.innerHTML = iconSettings;
  buttonSettings.classList.add('enhancer-creator-settings');
  buttonSettings.addEventListener('click', settingsModal.bind(null, channel.slug));
  return el;
};

export const showManageCreators = withLoader(async () => {
  const { creatorSettings } = await getFromStorage({ creatorSettings: {} as Record<string, CreatorSettings> });
  // This could get expensive for long lists of channels...
  // but no way to query multiple slugs, alternative: check all at some point
  const cr = await Promise.all(Object.keys(creatorSettings).map(c => getChannel(c).catch<Partial<Nebula.Channel>>(() => ({
    title: '??',
    assets: { avatar: {} as Nebula.Asset<Nebula.IconSizes>, banner: undefined, featured: undefined, hero: undefined },
    slug: c,
  }))));
  const c = cr.filter(c => c !== null).sort((a, b) => {
    const nameA = a.title.toUpperCase();
    const nameB = b.title.toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  }).map(c => buildCreator(creatorSettings, c));
  buildModal(msg('optionsManageHiddenCreators'), msg('optionsManageHiddenCreatorsNone'), 'manage-hidden', ...c);
});

const click = async (creator: string, e: MouseEvent) => {
  const target = e.target as HTMLElement;

  const hideCreator = target.closest('.enhancer-hideCreator');
  const container = document.querySelector('.creator-settings-modal .body > div');
  if (hideCreator === null || container === null) return;
  const hide = container.classList.toggle('hidden');
  await toggleHideCreator(creator, hide);
};

const change = async (creator: string, e: Event) => {
  const target = e.target as HTMLInputElement;

  if (target.id === 'hide-after') {
    target.classList.toggle('has-value', !!target.value);
    const warning = target.closest('.enhancer-field').nextElementSibling;
    try {
      warning.textContent = '';
      parseTimeString(target.value);
      await setCreatorHideAfter(creator, target.value);
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
    } catch (ex) {
      warning.textContent = ex;
    }
  }
};