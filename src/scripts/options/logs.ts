import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { getBrowserInstance } from '../helpers/sharedExt';
import { buildModalDirect, withLoader } from './modal';

const msg = getBrowserInstance().i18n.getMessage;
const owner = 'cpiber';
const repo = 'NebulaEnhance';

enum VersionIdent {
  CURRENT,
  OLDER,
  NEWER,
};

const buildVersion = (ident: VersionIdent, r: Github.Release) => {
  const el = document.createElement('div');
  el.className = `version version-${r.tag_name} ${ident === VersionIdent.CURRENT ? 'current' : ident === VersionIdent.NEWER ? 'newer' : 'older'}`;
  const h = el.appendChild(document.createElement('h2'));
  h.className = 'version-title';
  const link = h.appendChild(document.createElement('a'));
  link.href = r.html_url;
  link.target = '_blank';
  link.innerText = r.name;
  const v = h.appendChild(document.createElement('span'));
  v.className = 'more';
  v.innerText = releaseToMore(ident, r);
  const time = el.appendChild(document.createElement('span'));
  time.className = 'published-at';
  time.textContent = new Date(r.published_at).toLocaleString();
  const body = el.appendChild(document.createElement('div'));
  body.innerHTML = r.body;
  return el;
};

const releaseToMore = (ident: VersionIdent, r: Github.Release) => [
  ...ident === VersionIdent.CURRENT ? [msg('optionsChangelogYourVersion')] : [],
  ...([ 'draft', 'prerelease' ] as Array<keyof Github.Release>).filter(e => r[e] === true).map(s => s[0].toUpperCase() + s.slice(1)),
].join(', ');

export const showLogs = withLoader(async (currentVersion: string, installed = false) => {
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
  const rs = await Promise.all(
    releases.map(async r => ({ ...r, body: DOMPurify.sanitize(await marked(r.body)) })),
  );
  let ident = VersionIdent.NEWER;
  const elements = Array.from<HTMLElement>({ length: rs.length });
  for (let i = 0; i < elements.length; ++i) {
    const isCurrent = rs[i].tag_name === cv;
    elements[i] = buildVersion(isCurrent ? VersionIdent.CURRENT : ident, rs[i]);
    if (isCurrent) ident = VersionIdent.OLDER;
  }
  const last = document.createElement('p');
  last.className = 'all-releases';
  const full = last.appendChild(document.createElement('a'));
  full.className = 'enhancer-button';
  full.href = `https://github.com/${owner}/${repo}/releases`;
  full.target = '_blank';
  full.innerText = msg('optionsChangelogAllReleases');
  const welcome = document.createElement('div');
  welcome.className = 'enhancer-welcome-banner';
  welcome.innerHTML = msg('optionsChangelogInstalled');
  buildModalDirect(msg('optionsChangelogTitle'), installed ? welcome : null, 'changelog', ...elements, last);
});