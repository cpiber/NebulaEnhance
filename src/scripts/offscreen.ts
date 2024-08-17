import browser from 'webextension-polyfill';
import { getInformation } from './page/offscreen';

browser.runtime.onMessage.addListener(async (message: { [key: string]: any; }) => {
  if (message.target !== 'offscreen') {
    return false;
  }
  console.dev.log('Received message for offcanvas', message);
  switch (message.type) {
    case 'getCreatorInformation': {
      const data = await getInformation();
      await browser.runtime.sendMessage({
        type: 'receiveCreatorInformation',
        target: 'background',
        data
      });
    } break;
  }
});