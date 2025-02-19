
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
  const left = document.querySelectorAll('#video-controls > :last-child > :first-child > *');
  const right = document.querySelectorAll('#video-controls > :last-child > :last-child > *');
  if (left.length != 3)
    throw new Error('Expected three buttons on left');
  const hasChromecast = document.querySelector('#video-controls > div > :last-child > [aria-label="Chromecast"]');
  if (hasChromecast) {
    if (right.length != 6 && right.length != 7)
      throw new Error('Chromecast detected, expected 6 or 7 buttons on right');
  } else if (right.length != 4 && right.length != 5)
    throw new Error('No Chromecast detected, expected 4 or 5 buttons on right');
  const expectNoSubtitle = hasChromecast ? right.length === 6 : right.length === 4;
  const givenLeft = builtin.slice(0, left.length);
  const givenRight = builtin.slice(left.length)
    .filter(hasChromecast ? () => true : e => e != 'picture-in-picture-button' && e != 'chromecast-button')
    .filter(expectNoSubtitle ? e => e != 'subtitles-toggle-button' : () => true);
  if (givenRight.length != right.length)
    throw new Error(`Logic error, found ${right.length} expected ${givenRight.length}`);
  for (let i = 0; i < left.length; ++i)
    (left[i].querySelector('button') || left[i]).id = givenLeft[i];
  for (let i = 0; i < right.length; ++i)
    (right[i].querySelector('button') || right[i]).id = givenRight[i];
};
