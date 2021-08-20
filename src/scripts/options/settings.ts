export class Settings {
  private static instance: Settings = null;

  playbackChange: HTMLInputElement = undefined;
  autoplay: HTMLInputElement = undefined;
  volumeEnabled: HTMLInputElement = undefined;
  volumeLog: HTMLInputElement = undefined;
  volumeChange: HTMLInputElement = undefined;
  youtube: HTMLInputElement = undefined;
  customScriptPage: HTMLTextAreaElement = undefined;
  showChangelogs: HTMLInputElement = undefined;

  protected constructor() {
    Object.keys(this as Settings).forEach(prop => {
      this[prop] = document.querySelector(`[name="${prop}"]`);
    });
  }

  static get() {
    return this.instance ? this.instance : this.instance = new this();
  }
}

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
    data[key] = val;
  });

  Settings.get().volumeLog.disabled = !data.volumeEnabled;
  Settings.get().volumeChange.disabled = !data.volumeEnabled;

  return data;
};