import { purgeCacheIfNecessary } from '../background/ext';
import { arrFromLengthy, getBrowserInstance, getFromStorage, parseTimeString, toTimeString } from '../helpers/sharedExt';

export class Settings {
  private static instance: Settings = null;

  playbackChange: HTMLInputElement = undefined;
  autoplay: HTMLInputElement = undefined;
  autoplayQueue: HTMLInputElement = undefined;
  volumeEnabled: HTMLInputElement = undefined;
  volumeLog: HTMLInputElement = undefined;
  volumeShow: HTMLInputElement = undefined;
  volumeChange: HTMLInputElement = undefined;
  useFirstSubtitle: HTMLInputElement = undefined;
  youtube: HTMLInputElement = undefined;
  ytOpenTab: HTMLInputElement = undefined;
  watchnebula: HTMLInputElement = undefined;
  rss: HTMLInputElement = undefined;
  hideVideosEnabled: HTMLInputElement = undefined;
  hideVideosPerc: HTMLInputElement = undefined;
  customScriptPage: HTMLTextAreaElement = undefined;
  showChangelogs: HTMLInputElement = undefined;
  visitedColor: HTMLInputElement = undefined;
  purgetime: HTMLInputElement = undefined;

  protected constructor() {
    Object.keys(this as Settings).forEach(prop => {
      const cc = arrFromLengthy(document.querySelectorAll<HTMLInputElement>(`[name="${prop}"]`));
      this[prop] = cc[0] as never;
      if (cc.length > 1) {
        for (const e of cc) {
          const updateOthers = () => {
            for (const other of cc) if (other !== e) {
              other.value = e.value;
              other.checked = e.checked;
            }
          };
          e.addEventListener('focusout', updateOthers);
          e.addEventListener('change', updateOthers);
          e.addEventListener('keyup', updateOthers);
        }
      }
    });
  }

  static get() {
    return this.instance ? this.instance : this.instance = new this();
  }
}

const testStyle = document.createElement('style');
const vError = document.querySelector<HTMLSpanElement>('.visited-color-warning');
const pError = document.querySelector<HTMLSpanElement>('.purgetime-warning');
export const toData = async (useDefaults = false) => {
  const els = Settings.get();
  const data: { [key in keyof typeof els]?: string | number | string[] | number[] | boolean } = {};
  Object.keys(els).forEach(key => {
    let val: string | number | boolean = !useDefaults ? els[key].value : els[key].dataset.default;
    if (els[key].type === 'number') {
      val = +val;
      if (isNaN(val) || val == 0)
        val = +els[key].dataset.default;
    } else if (els[key].type === 'checkbox') {
      val = !useDefaults ? (els[key] as HTMLInputElement).checked : !!val;
    }
    if (els[key].classList.contains('enhancer-text-input')) {
      els[key].classList.toggle('has-value', !!val);
    }
    data[key] = val;
  });

  data.visitedColor = (data.visitedColor as string).split(';')[0].trim();
  els.visitedColor.value = data.visitedColor;

  testStyle.style.color = '';
  testStyle.style.color = data.visitedColor;
  vError.style.display = testStyle.style.color === '' && data.visitedColor !== '' ? '' : 'none';

  try {
    const parsed = parseTimeString(data.purgetime as string);
    pError.classList.remove('warning');
    pError.classList.add('hint');
    await purgeCacheIfNecessary();
    const { lastpurged } = await getFromStorage({ lastpurged: 0 });
    const last = new Date(lastpurged);
    const next = new Date(lastpurged + parsed * 1000);
    pError.innerHTML = getBrowserInstance().i18n.getMessage(
      'optionsPurgetimeNotice',
      [
        last.toLocaleDateString() === next.toLocaleDateString() ? last.toLocaleTimeString() : last.toLocaleString(),
        last.toLocaleDateString() === next.toLocaleDateString() ? next.toLocaleTimeString() : next.toLocaleString(),
        toTimeString((next.getTime() - new Date().getTime()) / 1000),
      ],
    );
  } catch (e) {
    data.purgetime = els.purgetime.dataset.default;
    pError.classList.add('warning');
    pError.classList.remove('hint');
    pError.innerHTML = e instanceof Error ? e.message : e;
  }
  if (!data.purgetime.toString().trim())
    data.purgetime = '0s';

  if (els.hideVideosPerc.value.length)
    data.hideVideosPerc = Math.max(0, Math.min(100, +data.hideVideosPerc));

  return data;
};