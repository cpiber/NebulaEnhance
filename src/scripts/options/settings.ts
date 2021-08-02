export class Settings {
  private static instance: Settings = null;

  playbackRate: HTMLInputElement = undefined;
  playbackChange: HTMLInputElement = undefined;
  volume: HTMLInputElement = undefined;
  autoplay: HTMLInputElement = undefined;
  targetQualities: HTMLInputElement = undefined;
  subtitles: HTMLInputElement = undefined;
  theatre: HTMLInputElement = undefined;
  youtube: HTMLInputElement = undefined;
  customScriptPage: HTMLTextAreaElement = undefined;
  customScript: HTMLTextAreaElement = undefined;
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
    if (els[key].type === "number") {
      val = +val;
      if (isNaN(val) || val == 0)
        val = +els[key].dataset.default;
    } else if (els[key].type === "checkbox") {
      val = !useDefaults ? (els[key] as HTMLInputElement).checked : !!val;
    }
    data[key] = val;
  });

  // transforms
  const m = (data.targetQualities as string).match(/^\s*\[(.*)\]\s*/);
  if (m)
    data.targetQualities = m[1]; // remove [] around array
  data.targetQualities = (data.targetQualities as string).split(',').filter(e => e.trim() !== "").map(e => +e).filter(e => !isNaN(e));
  els.targetQualities.value = data.targetQualities.join(', ');

  return data;
};