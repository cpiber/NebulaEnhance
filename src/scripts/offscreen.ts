import browser from 'webextension-polyfill';
import { getInformation } from './page/offscreen';

browser.runtime.onMessage.addListener((message: { [key: string]: any; }, sender, sendMessage) => {
  if (message.target !== 'offscreen') {
    return false;
  }
  console.dev.log('Received message for offcanvas', message);
  switch (message.type) {
    case 'getCreatorInformation': {
      getInformation().then(sendMessage);
      return true;
    } break;
  }
});