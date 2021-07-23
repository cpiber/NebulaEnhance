// wrapper to keep entry script here
import { init } from "./content/player";
import { mutation } from "./helpers/shared";

(() => {
  if (document.body.classList.contains('enhancer-player'))
    return;
  document.body.classList.add('enhancer-player');

  const cb = mutation(() => {
    init().catch(console.error);
  });
  const m = new MutationObserver(cb);
  m.observe(document.querySelector('#root'), { subtree: true, childList: true });
  cb();
})();