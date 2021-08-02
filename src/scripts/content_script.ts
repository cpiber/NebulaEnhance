import { nebula } from "./content";
import { getBrowserInstance, injectScript } from "./helpers/sharedBrowser";

const b = getBrowserInstance();
const local = b.storage.local;

const zype = async () => {
  // inject extension's script
  await injectScript(b.runtime.getURL('/scripts/zype.js'), document.body);
  // inject custom script (if available)
  const s: string = (await local.get({ customScript: '' })).customScript;
  if (!s) return;
  injectScript(document.body, s);
};

(() => {
  switch (document.location.host) {
    case "player.zype.com":
    case "content.watchnebula.com":
      zype();
      break;
    default:
      nebula();
      break;
  }
})();

