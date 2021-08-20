import { getBrowserInstance } from '../../helpers/sharedExt';
import iconClose from '../../../icons/close.svg';
import iconNext from '../../../icons/next.svg';
import iconReverse from '../../../icons/reverse.svg';
import iconShare from '../../../icons/share.svg';

const nothingToPlay = getBrowserInstance().i18n.getMessage('pageNothingToPlay');
const share = getBrowserInstance().i18n.getMessage('pageShareQueue');
const link = getBrowserInstance().i18n.getMessage('pageShareLink');
const starthere = getBrowserInstance().i18n.getMessage('pageShareStartHere');

export const html = `
<div class="enhancer-queue-inner">
  <div class="top">
    <div class="current">
      <span class="title">${nothingToPlay}</span>
      <span class="no">-</span> / <span class="of">0</span>
      <span class="prev" role="queue-previous">${iconNext}</span><span class="next" role="queue-next">${iconNext}</span>
      <span class="reverse clickable">${iconReverse}</span>
    </div>
    <span class="share clickable">${iconShare}</span>
    <span class="close clickable" role="queue-close">${iconClose}</span>
  </div>
  <div class="elements"></div>
</div>
<div class="enhancer-queue-share-bg hidden">
  <div class="enhancer-queue-share">
    <div class="top">
      <h2 class="current">${share}</h2>
      <div class="close" role="share-close">${iconClose}</div>
    </div>
    <div class="body">
      <span>${link}:</span>
      <input type="text" readonly />
      <label>
        <input type="checkbox" checked /> ${starthere}
      </label>
    </div>
  </div>
</div>
`;