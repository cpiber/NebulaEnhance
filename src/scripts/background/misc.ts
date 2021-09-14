
export const loadCreators = async () => {
  const res = await fetch('https://standard.tv/creators/');
  const body = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(body, 'text/html');
  return Array.from(doc.querySelectorAll('#creator-wall .youtube-creator')).map(c => ({
    name: c.querySelector('img').alt,
    nebula: c.querySelector<HTMLAnchorElement>('.link.nebula')?.href,
    channel: c.getAttribute('data-video'),
    uploads: c.getAttribute('data-video') ? 'UU' + c.getAttribute('data-video').substr(2) : undefined,
  }));
};

export const normalizeString = (str: string) => str.toLowerCase().normalize('NFD').replace(/\p{Pd}/g, '-')
/* eslint-disable-next-line no-misleading-character-class */
  .replace(/["'()[\]{}\u0300-\u036f]/g, '');
