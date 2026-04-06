import browser from 'webextension-polyfill';
import { getInformation } from './page/offscreen';

browser.runtime.onMessage.addListener((message: unknown, sender, sendMessage) => {
  if (message === undefined || message === null) return;
  if (typeof message !== 'object' || !('target' in message) || message.target !== 'offscreen') {
    return;
  }
  console.dev.log('Received message for offcanvas', message);
  if (!('type' in message)) return;
  switch (message.type) {
    case 'getCreatorInformation': {
      getInformation().then(sendMessage);
      return true;
    } break;
  }
});