import iconSettings from '../../icons/settings.svg';
import { CreatorSettings, btnClick, inputChange, showSettingsModal } from '../content/nebula/creator-settings';
import { getChannel } from '../helpers/api';
import { getBrowserInstance, getFromStorage } from '../helpers/sharedExt';
import { buildModal, withLoader } from './modal';

const msg = getBrowserInstance().i18n.getMessage;
const textSettings = JSON.parse(msg('optionsCreatorTexts'));

const settingsModal = async (channel: string) => {
  const cl = btnClick.bind(null, channel);
  const ch = inputChange.bind(null, channel);
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
  const avatar = channel.assets.avatar?.[32]?.original || channel.assets.avatar?.[Object.keys(channel.assets.avatar)[0]]?.original || channel.images?.avatar?.src;
  const img = h.appendChild(document.createElement('img'));
  img.src = avatar;
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
    if (s.hidePlus) parts.push(textSettings.plus);
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
  const creatorNames = Object.keys(creatorSettings);
  const cr: Partial<Nebula.Channel>[] = [];
  for (let i = 0; i < creatorNames.length; i += 5) {
    const a = await Promise.all(creatorNames.slice(i, i + 5).map(c => getChannel(c).catch<Partial<Nebula.Channel>>(() => ({
      title: '??',
      assets: { avatar: {} as Nebula.Asset<Nebula.IconSizes>, banner: undefined, featured: undefined, hero: undefined },
      slug: c,
    }))));
    Array.prototype.push.apply(cr, a);
  }
  const c = cr.filter(c => c !== null).sort((a, b) => {
    const nameA = a.title.toUpperCase();
    const nameB = b.title.toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  }).map(c => buildCreator(creatorSettings, c));
  buildModal(msg('optionsManageHiddenCreators'), msg('optionsManageHiddenCreatorsNone'), 'manage-hidden', ...c);
});
