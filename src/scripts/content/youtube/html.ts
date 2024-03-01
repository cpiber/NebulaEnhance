import { getBrowserInstance, nebulavideo } from '../../helpers/sharedExt';

const watchOnNebula = getBrowserInstance().i18n.getMessage('pageWatchOnNebula');
const goChannel = getBrowserInstance().i18n.getMessage('pageGoChannel');
const videoConfidence = getBrowserInstance().i18n.getMessage('pageVideoConfidence');
const searchConfidence = getBrowserInstance().i18n.getMessage('pageSearchConfidence');

export const constructButton = (vid: nebulavideo, isMobile = false) => {
  if (!document.querySelector('.watch-on-nebula') || document.querySelector('.watch-on-nebula').children.length === 0) {
    Array.from(document.querySelectorAll<HTMLElement>('.watch-on-nebula')).forEach(n => n.remove());
    // for some reason youtube custom elements clear their inner html in construct, so we have to do it like this
    const button = document.body.appendChild(document.createElement('div'));
    button.id = 'sponsor-button';
    button.className = 'style-scope ytd-video-owner-renderer watch-on-nebula';
    const brender = button.appendChild(document.createElement('ytd-button-renderer'));
    brender.id = 'nebula-button';
    brender.className = 'style-scope ytd-video-owner-renderer';
    brender.setAttribute('button-renderer', '');
    const bshape = brender.appendChild(document.createElement('yt-button-shape'));
    const btn = bshape.appendChild(document.createElement('button'));
    btn.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m';
    btn.ariaLabel = watchOnNebula;
    const bdiv = btn.appendChild(document.createElement('div'));
    bdiv.className = 'cbox yt-spec-button-shape-next--button-text-content';
    const bspan = bdiv.appendChild(document.createElement('span'));
    bspan.className = 'yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap';
    bspan.textContent = isMobile ? 'Nebula' : watchOnNebula;
    bspan.setAttribute('href', vid.link);
    const bfeedback = btn.appendChild(document.createElement('yt-touch-feedback-shape'));
    bfeedback.style.borderRadius = 'inherit';
    const bfdiv = bfeedback.appendChild(document.createElement('div'));
    bfdiv.className = 'yt-spec-touch-feedback-shape yt-spec-touch-feedback-shape--touch-response';
    bfdiv.ariaHidden = 'true';
    bfdiv.appendChild(document.createElement('div')).className = 'yt-spec-touch-feedback-shape__stroke';
    bfdiv.appendChild(document.createElement('div')).className = 'yt-spec-touch-feedback-shape__fill';
    brender.appendChild(document.createElement('tp-yt-paper-tooltip'));
    btn.title = generateText(vid);
    btn.addEventListener('click', () => {
      window.open(bspan.getAttribute('href'));
    });
  } else {
    document.querySelector<HTMLSpanElement>('.watch-on-nebula span').setAttribute('href', vid.link);
  }
  const b = document.querySelector<HTMLElement>('.watch-on-nebula');
  b.style.display = '';
  return b;
};

const generateText = (vid: nebulavideo) => {
  switch (vid.is) {
    case 'channel':
      return goChannel;
    case 'video':
      return `${videoConfidence}: ${(vid.confidence * 100).toFixed(1)}%`;
    case 'search':
      return `${searchConfidence}: ${(vid.confidence * 100).toFixed(1)}%`;
  }
};