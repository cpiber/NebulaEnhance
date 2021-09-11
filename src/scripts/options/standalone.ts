import { getBrowserInstance } from '../helpers/sharedExt';

export const standalone = (alone: boolean) => {
  if (!alone) return;

  const ext = getBrowserInstance().i18n.getMessage('title');
  document.title = `${ext} — ${document.title}`;

  const $title = document.querySelector('.page-title');
  if ($title.childNodes.length !== 1)
    return;

  const icon = document.createElement('img');
  icon.src = getBrowserInstance().runtime.getURL('icons/icon_128.png');
  icon.alt = ext;
  icon.className = 'icon';
  $title.prepend(icon);
};