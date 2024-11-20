
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
  'chromecast-button',
  'picture-in-picture-button',
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
  'auto-play-switch': -7,
  'subtitles-toggle-button': -6,
  'settings-button': -5,
  'chromecast-button': -4,
  'picture-in-picture-button': -3,
  'theater-mode-button': -2,
  'fullscreen-mode-button': -1,
  'queue-prev': 0,
  'queue-next': 2,
  'time': 4,
  'expand': -9,
  'speeddial': -8,
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
export const setDefaultIds = () => {
  const buttons = document.querySelectorAll('#video-controls button');
  let given = builtin.filter(i => i != 'time');
  // Chromecast and Picture-in-Picture are only available in Chrome
  if (buttons.length == given.length - 2) given = given.filter(i => i != 'chromecast-button' && i != 'picture-in-picture-button');
  if (buttons.length != given.length) throw new Error('Nebula changed player buttons, not attempting to re-ID');
  for (let i = 0; i < buttons.length; ++i)
    buttons[i].id = given[i];
  document.querySelector('#video-controls > :last-child > :first-child > :last-child').id = 'time';
};
