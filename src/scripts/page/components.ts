
export type PlayerComponentSetting = {
  enabled?: boolean,
  position?: number, // positive = left, negative = right
};

export const builtin = [
  'toggle-play-button',
  'volume-toggle-button',
  'time',
  'auto-play-switch',
  'subtitles-toggle-button',
  'settings-button',
  'theater-mode-button',
  'fullscreen-mode-button',
] as const;
export const ours = [
  'queue-prev',
  'queue-next',
  'expand',
  'speeddial',
] as const;
type Comp = (typeof builtin | typeof ours)[number];
export type Settings = Record<Comp, PlayerComponentSetting>;

export const defaultPositions: Record<Comp, number> = {
  'toggle-play-button': 1,
  'volume-toggle-button': 3,
  'auto-play-switch': -5,
  'subtitles-toggle-button': -4,
  'settings-button': -3,
  'theater-mode-button': -2,
  'fullscreen-mode-button': -1,
  'queue-prev': 0,
  'queue-next': 2,
  'time': 4,
  'expand': -7,
  'speeddial': -6,
};
export const toSorted = (settings: Partial<Settings>, includeDisalbed = false) => [ ...builtin, ...ours ]
  .filter(c => includeDisalbed || (settings[c]?.enabled ?? true))
  .sort((a, b) => (settings[a]?.position ?? defaultPositions[a]) - (settings[b]?.position ?? defaultPositions[b]));
export const minMaxPos = (settings: Partial<Settings>, includeDisalbed = false) => [ ...builtin, ...ours ]
  .filter(c => includeDisalbed || (settings[c]?.enabled ?? true))
  .reduce((acc, c) => {
    const cur = (settings[c]?.position ?? defaultPositions[c]);
    const n = { ...acc };
    if (cur < acc.min) n.min = cur;
    if (cur > acc.max) n.max = cur;
    return n;
  }, { min: 0, max: 0 });
export const slot = <S, T>(name: Comp, comp: PlayerComponentSetting, left: S, right: T): S | T => (comp?.position ?? defaultPositions[name]) < 0 ? right : left;
