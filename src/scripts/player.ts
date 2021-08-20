import { init } from './page/player';

(async () => {
  if (document.body.classList.contains('enhancer-player'))
    return;
  document.body.classList.add('enhancer-player');

  await init();
})();