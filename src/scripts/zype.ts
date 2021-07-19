// wrapper to keep entry script here
import { init } from "./pages/zype/zype";

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