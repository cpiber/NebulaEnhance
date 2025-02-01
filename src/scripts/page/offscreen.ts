import type { Creator } from '../background';

export const getInformation = async () => {
  const res = await fetch('https://talent.nebula.tv/creators/');
  const body = await res.text();
  const res2 = await fetch('https://raw.githubusercontent.com/cpiber/NebulaEnhance/refs/heads/master/channels.json');
  const additional: Creator[] = await res2.json();
  const parser = new DOMParser();
  const doc = parser.parseFromString(body, 'text/html');
  const nebula = Array.from(doc.querySelectorAll('#creator-wall .youtube-creator')).map(c => ({
    name: c.querySelector('img').alt,
    nebula: c.querySelector<HTMLAnchorElement>('.link.nebula')?.href?.split('/')?.pop(),
    nebulaAlt: new URL(c.querySelector<HTMLAnchorElement>('h3 a').href).pathname.split('/')[1],
    channel: c.getAttribute('data-video'),
    uploads: c.getAttribute('data-video') ? 'UU' + c.getAttribute('data-video').substring(2) : undefined,
  }));
  return nebula.concat(...additional);
};