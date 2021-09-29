export class Settings {
  private static instance: Settings = null;

  playbackChange: HTMLInputElement = undefined;
  autoplay: HTMLInputElement = undefined;
  autoplayQueue: HTMLInputElement = undefined;
  volumeEnabled: HTMLInputElement = undefined;
  volumeLog: HTMLInputElement = undefined;
  volumeShow: HTMLInputElement = undefined;
  volumeChange: HTMLInputElement = undefined;
  youtube: HTMLInputElement = undefined;
  customScriptPage: HTMLTextAreaElement = undefined;
  showChangelogs: HTMLInputElement = undefined;
  visitedColor: HTMLInputElement = undefined;

  protected constructor() {
    Object.keys(this as Settings).forEach(prop => {
      this[prop] = document.querySelector(`[name="${prop}"]`);
    });
  }

  static get() {
    return this.instance ? this.instance : this.instance = new this();
  }
}

const testStyle = document.createElement('style');
const vError = document.querySelector<HTMLSpanElement>('.visited-color-warning');
export const toData = (useDefaults = false) => {
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
    if (els[key].classList.contains('enhancer-text-input') && val) {
      els[key].classList.add('has-value');
    }
    data[key] = val;
  });

  data.visitedColor = (data.visitedColor as string).split(';')[0].trim();
  els.visitedColor.value = data.visitedColor;

  testStyle.style.color = '';
  testStyle.style.color = data.visitedColor;
  vError.style.display = testStyle.style.color === '' && data.visitedColor !== '' ? '' : 'none';

  return data;
};