import { getBrowserInstance, nebulavideo } from '../../helpers/sharedExt';

const watchOnNebula = getBrowserInstance().i18n.getMessage('pageWatchOnNebula');
const goChannel = getBrowserInstance().i18n.getMessage('pageGoChannel');
const videoConfidence = getBrowserInstance().i18n.getMessage('pageVideoConfidence');
const searchConfidence = getBrowserInstance().i18n.getMessage('pageSearchConfidence');

export const constructButton = (vid: nebulavideo, before: HTMLElement, isMobile = false) => {
  if (!document.querySelector('.watch-on-nebula') || document.querySelector('.watch-on-nebula').children.length === 0) {
    Array.from(document.querySelectorAll<HTMLElement>('.watch-on-nebula')).forEach(n => n.remove());
    // for some reason youtube custom elements clear their inner html in construct, so we have to do it like this
    const button = document.createElement('div');
    button.style.display = 'none';
    before.before(button);
    button.id = 'sponsor-button';
    button.className = 'style-scope ytd-video-owner-renderer watch-on-nebula';
    const brender = button.appendChild(document.createElement('ytd-button-renderer'));
    brender.id = 'nebula-button';
    brender.className = 'style-scope ytd-video-owner-renderer';
    brender.setAttribute('button-renderer', '');
    const bshape = brender.appendChild(document.createElement('yt-button-shape'));
    const btn = bshape.appendChild(document.createElement('button'));
    btn.className = 'ytSpecButtonShapeNextHost ytSpecButtonShapeNextFilled ytSpecButtonShapeNextMono ytSpecButtonShapeNextSizeM ytSpecButtonShapeNextEnableBackdropFilterExperiment';
    btn.ariaLabel = watchOnNebula;
    const bdiv = btn.appendChild(document.createElement('div'));
    bdiv.className = 'ytSpecButtonShapeNextButtonTextContent ytSpecButtonShapeNextElevatedContent';
    const bspan = bdiv.appendChild(document.createElement('span'));
    bspan.className = 'ytAttributedStringHost ytAttributedStringWhiteSpaceNoWrap';
    bspan.textContent = isMobile ? 'Nebula' : watchOnNebula;
    bspan.setAttribute('href', vid.link);
    const bfeedback = btn.appendChild(document.createElement('yt-touch-feedback-shape'));
    bfeedback.style.borderRadius = 'inherit';
    bfeedback.className = 'ytSpecTouchFeedbackShapeHost ytSpecTouchFeedbackShapeTouchResponseInverse';
    bfeedback.ariaHidden = 'true';
    bfeedback.appendChild(document.createElement('div')).className = 'ytSpecTouchFeedbackShapeStroke';
    bfeedback.appendChild(document.createElement('div')).className = 'ytSpecTouchFeedbackShapeFill';
    const tooltip = brender.appendChild(document.createElement('tp-yt-paper-tooltip'));
    tooltip.setAttribute('offset', '8');
    tooltip.setAttribute('disable-upgrade', '');
    btn.title = generateText(vid);
    btn.addEventListener('click', () => {
      window.open(bspan.getAttribute('href'));
    });
  } else {
    document.querySelector<HTMLSpanElement>('.watch-on-nebula span').setAttribute('href', vid.link);
    document.querySelector<HTMLButtonElement>('.watch-on-nebula button').title = generateText(vid);
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