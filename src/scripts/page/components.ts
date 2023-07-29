
export type PlayerComponentSetting = {
  enabled?: boolean,
  position?: number, // positive = left, negative = right
};

export const builtin = [
  'toggle-play-button',
  'volume-toggle-button',
  'auto-play-switch',
  'subtitles-toggle-button',
  'settings-button',
  'theater-mode-button',
  'fullscreen-mode-button',
] as const;
export const ours = [
  'queue-back',
  'queue-next',
  'time',
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
  'queue-back': 0,
  'queue-next': 2,
  'time': 4,
  'expand': -7,
  'speeddial': -6,
};
export const toSorted = (settings: Partial<Settings>) => [...builtin, ...ours]
  .filter(c => settings[c]?.enabled ?? true)
  .sort((a, b) => (settings[a]?.position ?? defaultPositions[a]) - (settings[b]?.position ?? defaultPositions[b]));
export const slot = <S, T>(name: Comp, comp: PlayerComponentSetting, left: S, right: T): S | T => (comp?.position || defaultPositions[name]) < 0 ? right : left;
