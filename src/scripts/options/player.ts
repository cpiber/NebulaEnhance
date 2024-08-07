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
import { getBrowserInstance, getFromStorage, isMobile, setToStorage } from '../helpers/sharedExt';
import { Settings, builtin, defaultPositions, minMaxPos, ours as ourComponents, slot, toSorted } from '../page/components';
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
  'queue-prev': iconNext,
  'queue-next': iconNext,
  'time': '<div class="enhancer-time">00:16&nbsp;/&nbsp;25:02</div>',
  'expand': iconExpand,
  'speeddial': iconSpeed,
};
const nameToTitle: Record<Comp, string> = {
  'toggle-play-button': msg('optionsCompPlay'),
  'volume-toggle-button': msg('optionsCompVolume'),
  'auto-play-switch': msg('optionsCompAutoplay'),
  'subtitles-toggle-button': msg('optionsCompSubtitles'),
  'settings-button': msg('optionsCompSettings'),
  'theater-mode-button': msg('optionsCompTheater'),
  'fullscreen-mode-button': msg('optionsCompFullscreen'),
  'queue-prev': msg('optionsCompQueueBack'),
  'queue-next': msg('optionsCompQueueNext'),
  'time': msg('optionsCompTime'),
  'expand': msg('optionsCompExpand'),
  'speeddial': msg('optionsCompSpeed'),
};

const render = (settings: Partial<Settings>, selected: Comp = undefined) => {
  console.debug('Rendering for mobile?', isMobile());
  const wrapper = document.createElement('div');
  const vid = wrapper.appendChild(document.createElement('div'));
  vid.className = 'video-mock';
  if (isMobile()) vid.className += ' shadow-left';
  const vid2 = isMobile() ? wrapper.appendChild(document.createElement('div')) : null;
  if (vid2) vid2.className = 'video-mock right shadow-right';
  const left = vid.appendChild(document.createElement('div'));
  left.className = 'video-mock-left';
  const right = (!isMobile() ? vid : vid2).appendChild(document.createElement('div'));
  right.className = 'video-mock-right';
  const rerenderSel = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const sel = target.closest('.video-icon');
    if (sel === null || sel.id === selected) return;
    wrapper.replaceWith(render(settings, sel.id as Comp));
  }; // removing the element also removes the event listener, no need to clean this up
  vid.addEventListener('click', rerenderSel);
  if (vid2) vid2.addEventListener('click', rerenderSel);

  const sorted = !isMobile() ? toSorted(settings, true) : toSorted(settings, true).filter(b => [ 'volume-toggle-button', 'theater-mode-button' ].indexOf(b) === -1);
  console.dev.log('render', selected, settings, sorted);
  for (const comp of sorted) {
    const container = slot(comp, settings[comp], left, right);
    const icon = document.createElement('div');
    icon.className = 'video-icon';
    icon.innerHTML = nameToIcon[comp];
    icon.id = comp;
    if ([ 'queue-prev', 'queue-next' ].indexOf(comp) >= 0) icon.classList.add('max');
    if (selected === comp) icon.classList.add('selected');
    if (!(settings[comp]?.enabled ?? true)) icon.classList.add('disabled');
    container.appendChild(icon);
  }

  if (selected !== undefined) {
    const title = wrapper.appendChild(document.createElement('h2'));
    title.textContent = nameToTitle[selected];
    const enabled = wrapper.appendChild(document.createElement('label'));
    const check = enabled.appendChild(document.createElement('input'));
    enabled.appendChild(document.createTextNode(msg('optionsEnable')));
    check.type = 'checkbox';
    check.checked = settings[selected]?.enabled ?? true;
    check.addEventListener('click', async () => {
      if (!(selected in settings)) settings[selected] = {};
      settings[selected].enabled = !(settings[selected]?.enabled ?? true);
      wrapper.replaceWith(render(settings, selected));
      await setToStorage({ playerSettings: settings });
    });
    const updateWithPos = async (oldPos: number, newPos: number) => {
      if (oldPos === newPos) return;
      for (const other of sorted) {
        if ((settings[other]?.position ?? defaultPositions[other]) !== newPos) continue;
        if (!(other in settings)) settings[other] = {};
        settings[other].position = oldPos;
        if (!(selected in settings)) settings[selected] = {};
        settings[selected].position = newPos;
        wrapper.replaceWith(render(settings, selected));
        await setToStorage({ playerSettings: settings });
        return;
      }
      if (Math.sign(oldPos) === Math.sign(newPos)) return; // edge, don't move
      // otherwise moved to other side, new position
      if (!(selected in settings)) settings[selected] = {};
      settings[selected].position = newPos;
      wrapper.replaceWith(render(settings, selected));
      await setToStorage({ playerSettings: settings });
    };
    const left = wrapper.appendChild(document.createElement('button'));
    left.className = 'enhancer-button';
    left.textContent = msg('optionsPlayerConfigureLeft');
    left.addEventListener('click', async () => {
      const { min, max } = minMaxPos(settings, true);
      const newPos = curPos >= 0 ? Math.max(curPos - 1, 0) : curPos === min ? max + 1 : curPos - 1;
      await updateWithPos(curPos, newPos);
    });
    const right = wrapper.appendChild(document.createElement('button'));
    right.className = 'enhancer-button';
    right.textContent = msg('optionsPlayerConfigureRight');
    right.addEventListener('click', async () => {
      const { min, max } = minMaxPos(settings, true);
      const newPos = curPos < 0 ? Math.min(curPos + 1, -1) : curPos === max ? min - 1 : curPos + 1;
      await updateWithPos(curPos, newPos);
    });
    const curPos = settings[selected]?.position ?? defaultPositions[selected];
    if (curPos === -1) right.disabled = true;
    if (curPos === 0) left.disabled = true;
  }
  return wrapper;
};

export const showConfigurePlayers = withLoader(async () => {
  const { playerSettings } = await getFromStorage<{ playerSettings: Partial<Settings>; }>({ playerSettings: {} });
  await buildModal(msg('optionsPlayerConfigure'), '', 'configure-player', render(playerSettings));
});