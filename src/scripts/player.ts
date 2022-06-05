import { Event, sendEventHandler } from './helpers/shared';
import { findAPlayer, init, updatePlayerControls } from './page/player';

(async () => {
  updatePlayerControls(findAPlayer(), false, false); // clear controls after update
  sendEventHandler(Event.QUEUE_CHANGE, ({ canNext, canPrev }) => updatePlayerControls(findAPlayer(), canNext, canPrev));

  if (document.body.classList.contains('enhancer-player'))
    return;
  document.body.classList.add('enhancer-player');

  await init();
})();