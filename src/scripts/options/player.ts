import iconExpand from '../../icons/expand.svg';
import iconAutoplay from '../../icons/nebula/autoplay.svg';
import iconFullscreen from '../../icons/nebula/fullscreen.svg';
import iconPlay from '../../icons/nebula/play.svg';
import iconSettings from '../../icons/nebula/settings.svg';
import iconSubtitles from '../../icons/nebula/subtitles.svg';
import iconTheater from '../../icons/nebula/theater.svg';
import iconVolume from '../../icons/nebula/volume.svg';
import iconNext from '../../icons/next.svg';
import iconSpeed from '../../icons/speed.svg';
import { getBrowserInstance, getFromStorage } from '../helpers/sharedExt';
import { Settings, builtin, ours as ourComponents, slot, toSorted } from '../page/components';
import { buildModal, withLoader } from './modal';

const msg = getBrowserInstance().i18n.getMessage;

type Comp = (typeof builtin | typeof ourComponents)[number];

const nameToIcon: Record<Comp, string> = {
  'toggle-play-button': iconPlay,
  'volume-toggle-button': iconVolume,
  'auto-play-switch': iconAutoplay,
  'subtitles-toggle-button': iconSubtitles,
  'settings-button': iconSettings,
  'theater-mode-button': iconTheater,
  'fullscreen-mode-button': iconFullscreen,
  'queue-back': iconNext,
  'queue-next': iconNext,
  'time': '<div class="enhancer-time">00:16&nbsp;/&nbsp;25:02</div>',
  'expand': iconExpand,
  'speeddial': iconSpeed,
};

const render = (settings: Partial<Settings>) => {
  const wrapper = document.createElement('div');
  const vid = wrapper.appendChild(document.createElement('div'));
  vid.className = 'video-mock';
  const left = vid.appendChild(document.createElement('div'));
  left.className = 'video-mock-left';
  const right = vid.appendChild(document.createElement('div'));
  right.className = 'video-mock-right';

  const sorted = toSorted(settings);
  for (const comp of sorted) {
    const container = slot(comp, settings[comp], left, right);
    const icon = document.createElement('div');
    icon.innerHTML = nameToIcon[comp];
    icon.id = comp;
    if (['queue-back', 'queue-next'].indexOf(comp) >= 0) icon.classList.add('max');
    container.appendChild(icon);
  }
  return wrapper;
};

export const showConfigurePlayers = withLoader(async () => {
  const { playerSettings } = await getFromStorage<{ playerSettings: Partial<Settings>; }>({ playerSettings: {} });
  buildModal(msg('optionsPlayerConfigure'), '', 'configure-player', render(playerSettings));
});