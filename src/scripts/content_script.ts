import { nebula } from './content/nebula';
import { youtube } from './content/youtube';

(() => {
  if (window.location.hostname.endsWith('youtube.com')) {
    youtube();
  } else {
    nebula();
  }
})();

