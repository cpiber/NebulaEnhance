import { getBrowserInstance, injectFunction, nebulavideo } from '../../helpers/sharedExt';

const watchOnNebula = getBrowserInstance().i18n.getMessage('pageWatchOnNebula');
const goChannel = getBrowserInstance().i18n.getMessage('pageGoChannel');
const videoConfidence = getBrowserInstance().i18n.getMessage('pageVideoConfidence');
const searchConfidence = getBrowserInstance().i18n.getMessage('pageSearchConfidence');

export const constructButton = (vid: nebulavideo) => {
  // for some reason youtube custom elements clear their inner html in construct, so we have to do it like this
  const button = document.body.appendChild(document.createElement('div'));
  button.id = 'sponsor-button';
  button.className = 'style-scope ytd-video-owner-renderer watch-on-nebula';
  const brender = button.appendChild(document.createElement('ytd-button-renderer'));
  brender.id = 'nebula-button';
  brender.className = 'style-scope ytd-video-owner-renderer style-suggestive size-default';
  brender.setAttribute('is-paper-button', '');
  const link = brender.appendChild(document.createElement('a'));
  link.className = 'yt-simple-endpoint style-scope ytd-button-renderer';
  link.href = vid.link;
  if (vid.is !== 'video') link.target = '_blank';
  link.setAttribute('tabindex', '-1');
  const binner = link.appendChild(document.createElement('tp-yt-paper-button'));
  binner.id = 'button';
  binner.className = 'style-scope ytd-button-renderer style-suggestive size-default';
  const text = binner.appendChild(document.createElement('yt-formatted-string'));
  text.id = 'text';
  text.className = 'style-scope ytd-button-renderer style-suggestive size-default';
  text.textContent = watchOnNebula;
  const ripple = binner.appendChild(document.createElement('paper-ripple'));
  ripple.className = 'style-scope tp-yt-paper-button';
  const tooltip = link.appendChild(document.createElement('tp-yt-paper-tooltip'));
  tooltip.className = 'style-scope ytd-toggle-button-renderer';
  // we can't access custom properties from content-script, inject it
  injectFunction(document.body, text => {
    const t = document.querySelector<YoutubeTooltip>('#nebula-button tp-yt-paper-tooltip');
    t.__domApi.textContent = text;
    t.fitToVisibleBounds = true;
  }, generateText(vid));
  return button;
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