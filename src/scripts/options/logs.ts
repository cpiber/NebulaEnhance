import marked from 'marked';
import DOMPurify from 'dompurify';
import closeIcon from '../../icons/close.svg';
import { getBrowserInstance } from '../helpers/sharedExt';

const msg = getBrowserInstance().i18n.getMessage;
const owner = 'cpiber';
const repo = 'NebulaEnhance';

const buildModal = (title: string, body: string, classes = '', ...more: HTMLElement[]) => {
  const wrapper = document.querySelector<HTMLDivElement>('.modal__wrapper') || document.body.appendChild(document.createElement('div'));
  wrapper.classList.add('modal__wrapper', classes);
  wrapper.innerHTML = '';
  wrapper.style.display = '';
  const el = wrapper.appendChild(document.createElement('div'));
  el.className = 'modal options-modal';
  const inner = el.appendChild(document.createElement('div'));
  inner.className = 'modal__inner';
  const heading = inner.appendChild(document.createElement('div'));
  heading.className = 'heading';
  heading.appendChild(document.createElement('h1')).innerText = title;
  const close = heading.appendChild(document.createElement('span'));
  close.className = 'close';
  close.innerHTML = closeIcon;
  const content = inner.appendChild(document.createElement('div'));
  content.className = 'body content';
  content.innerHTML = DOMPurify.sanitize(marked(body));
  content.append(...more);
  close.addEventListener('click', () => wrapper.style.display = 'none');
  return wrapper;
};

const buildVersion = (cv: string, r: Github.Release) => {
  const el = document.createElement('div');
  el.className = `version version-${r.tag_name} ${r.tag_name === cv ? 'current' : ''}`;
  const h = el.appendChild(document.createElement('h2'));
  h.className = 'version-title';
  const link = h.appendChild(document.createElement('a'));
  link.href = r.html_url;
  link.target = '_blank';
  link.innerText = r.name;
  const v = h.appendChild(document.createElement('span'));
  v.className = 'more';
  v.innerText = releaseToMore(cv, r);
  const time = el.appendChild(document.createElement('span'));
  time.className = 'published-at';
  time.textContent = new Date(r.published_at).toLocaleString();
  const body = el.appendChild(document.createElement('div'));
  body.innerHTML = r.body;
  return el;
};

const releaseToMore = (cv: string, r: Github.Release) => [
  ...r.tag_name === cv ? [msg('optionsChangelogYourVersion')] : [],
  ...([ 'draft', 'prerelease' ] as Array<keyof Github.Release>).filter(e => r[e] === true).map(s => s[0].toUpperCase() + s.slice(1)),
].join(', ');

export const showLogs = async (currentVersion: string, installed = false) => {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=3`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
    method: 'GET',
  });
  const releases: Github.Release[] = await res.json();
  if (!releases)
    return;
  const cv = `v${currentVersion}`;
  const rs = releases.map(r => ({ ...r, body: DOMPurify.sanitize(marked(r.body)) })).map(r => buildVersion(cv, r));
  const last = document.createElement('p');
  last.className = 'all-releases';
  const full = last.appendChild(document.createElement('a'));
  full.href = `https://github.com/${owner}/${repo}/releases`;
  full.target = '_blank';
  full.innerText = msg('optionsChangelogAllReleases');
  buildModal(msg('optionsChangelogTitle'), installed ? msg('optionsChangelogInstalled') : '', 'changelog', ...rs, last);
};