import iconShow from '../../icons/show.svg';
import type { CreatorSettings } from '../content/nebula/creator-settings';
import { getChannel } from '../helpers/api';
import { getBrowserInstance, getFromStorage, toggleHideCreator } from '../helpers/sharedExt';
import { buildModal, withLoader } from './modal';

const msg = getBrowserInstance().i18n.getMessage;

const buildCreator = (channel: Nebula.Channel) => {
  const showCreator = msg('pageShowCreator');
  const el = document.createElement('div');
  el.className = 'hidden-creator';
  const h = el.appendChild(document.createElement('h2'));
  const avatar = channel.assets.avatar[32] || channel.assets.avatar[Object.keys(channel.assets.avatar)[0]];
  const img = h.appendChild(document.createElement('img'));
  img.src = avatar.original;
  img.alt = channel.title;
  img.className = 'avatar';
  const link = h.appendChild(document.createElement('a'));
  link.href = channel.share_url;
  link.target = '_blank';
  link.innerText = channel.title;
  link.title = channel.slug;
  const buttonShow = h.appendChild(document.createElement('button'));
  buttonShow.innerHTML = iconShow;
  buttonShow.classList.add('unhide-creator', 'show');
  buttonShow.setAttribute('aria-label', showCreator);
  buttonShow.title = showCreator;
  buttonShow.addEventListener('click', () => toggleHideCreator(channel.slug, false).then(() => el.remove()));
  return el;
};

export const showManageCreators = withLoader(async () => {
  const { creatorSettings } = await getFromStorage({ creatorSettings: {} as Record<string, CreatorSettings> });
  // This could get expensive for long lists of channels...
  // but no way to query multiple slugs, alternative: check all at some point
  const cr = await Promise.all(Object.keys(creatorSettings).filter(c => creatorSettings[c].hideCompletely).map(getChannel));
  const c = cr.filter(c => c !== null).sort((a, b) => {
    const nameA = a.title.toUpperCase();
    const nameB = b.title.toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  }).map(buildCreator);
  buildModal(msg('optionsManageHiddenCreators'), msg('optionsManageHiddenCreatorsNone'), 'manage-hidden', ...c);
});