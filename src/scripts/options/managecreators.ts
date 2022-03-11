import iconShow from '../../icons/show.svg';
import { getBrowserInstance, getFromStorage, toggleHideCreator } from '../helpers/sharedExt';
import { buildModal } from './modal';

const msg = getBrowserInstance().i18n.getMessage;

const buildCreator = (creator: string) => {
  const showCreator = msg('pageShowCreator');
  const el = document.createElement('div');
  el.className = 'hidden-creator';
  const h = el.appendChild(document.createElement('h2'));
  const link = h.appendChild(document.createElement('a'));
  link.href = `https://nebula.app/${creator}`;
  link.target = '_blank';
  link.innerText = creator;
  const buttonShow = h.appendChild(document.createElement('button'));
  buttonShow.innerHTML = iconShow;
  buttonShow.classList.add('hide-creator', 'show');
  buttonShow.setAttribute('aria-label', showCreator);
  buttonShow.title = showCreator;
  buttonShow.addEventListener('click', () => toggleHideCreator(creator, false).then(() => el.remove()));
  return el;
};

export const showManageCreators = async () => {
  const { hiddenCreators } = await getFromStorage({ hiddenCreators: [] as string[] });
  const c = hiddenCreators.sort().map(buildCreator);
  buildModal(msg('optionsManageHiddenCreators'), msg('optionsManageHiddenCreatorsNone'), 'manage-hidden', ...c);
};