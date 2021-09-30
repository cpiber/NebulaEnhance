import { BrowserMessage, getBrowserInstance, getFromStorage, isMobile, setToStorage } from './helpers/sharedExt';
import { load } from './options/form';
import { showLogs } from './options/logs';
import { Settings } from './options/settings';
import { standalone } from './options/standalone';

const cl = decodeURIComponent(window.location.hash.slice(1)).split(' ').filter(c => !!c);
if (cl.length)
  document.body.classList.add(...cl);
document.body.classList.toggle('mobile', isMobile());

const els = Settings.get();

// permissions for youtube comments
const { permissions } = getBrowserInstance();
els.youtube.addEventListener('change', async () => {
  const y = els.youtube;
  const perms: browser.permissions.Permissions = {
    origins: [
      '*://*.googleapis.com/*',
    ],
  };
  const success = await (y.checked ? permissions.request : permissions.remove)(perms);
  if (!success) y.checked = !y.checked; // revert
  if (y.checked && success) getBrowserInstance().runtime.sendMessage(BrowserMessage.LOAD_CREATORS);
});
permissions.onRemoved.addListener(p => p.origins?.length && (els.youtube.checked = false));

const aChange = () => {
  els.autoplayQueue.disabled = els.autoplay.checked;
};
els.autoplay.addEventListener('change', aChange);
const vChange = () => {
  const c = els.volumeEnabled.checked;
  els.volumeLog.disabled = !c;
  els.volumeChange.disabled = !c;
};
els.volumeEnabled.addEventListener('change', vChange);

document.querySelector('#showChangelogsNow').addEventListener('click', () => showLogs(getBrowserInstance().runtime.getManifest().version));

// load initial values from storage
load(true).then(aChange).then(vChange);

// changelog
(async () => {
  standalone(document.body.classList.contains('standalone'));

  const showChangelogs = document.body.classList.contains('show-changelogs');
  document.body.classList.remove('show-changelogs');
  window.location.hash = document.body.className;

  const show: boolean = (await getFromStorage({ showChangelogs: true })).showChangelogs;
  const version: string = (await getFromStorage({ lastVersion: '-1' })).lastVersion;
  const actualVersion = getBrowserInstance().runtime.getManifest().version;
  const installed = version === '-1';
  console.debug(show, version, actualVersion, installed);
  // show changelog or install message
  if (installed || (show && version !== actualVersion) || showChangelogs)
    showLogs(actualVersion, installed);
  setToStorage({ lastVersion: actualVersion });
})();