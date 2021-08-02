// wrapper to keep entry script here
import { init } from "./page/player";

(() => {
  if (document.body.classList.contains('enhancer-player'))
    return;
  document.body.classList.add('enhancer-player');

  init();
})();