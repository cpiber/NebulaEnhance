import { getBrowserInstance } from "../scripts/_sharedBrowser";

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
  const title = document.createElement('span');
  title.className = 'text';
  title.textContent = document.title;
  $title.firstChild.remove();
  $title.append(icon, title);
};