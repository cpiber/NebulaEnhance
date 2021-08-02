// wrapper to keep entry script here
// TODO: remove this in a week when it becomes obsolete
import { init } from "./page/player/zype";

(() => {
  if (document.body.classList.contains('enhancer-zype'))
    return;
  document.body.classList.add('enhancer-zype');

  const waitForTheo = () => {
    console.debug('waiting');
    if (!window.theoplayer)
      return;
    console.debug('ready');
    clearInterval(int);
    init();
  };
  const int = setInterval(waitForTheo, 100);
})();