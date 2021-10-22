import { nebula } from './content/nebula';
import { youtube } from './content/youtube';
import { BrowserMessage, getBrowserInstance } from './helpers/sharedExt';

(() => {
  getBrowserInstance().runtime.sendMessage(BrowserMessage.INIT_PAGE);

  if (window.location.hostname.endsWith('youtube.com')) {
    youtube();
  } else {
    nebula();
  }
})();

