import { sendEventHandler, sendMessage } from '../helpers/shared';
import { init as initDispatch, loadPrefix } from './dispatcher';
import SpeedDial from './components/speeddial';
import VolumeText from './components/volume';
import QueueButton from './components/queue';
import type { VPlayer } from '../../types/videojs';

type Comp<T> = T extends (...args: any[]) => Promise<infer R> ? R : T extends (...args: any[]) => infer R ? R : never;

function getFromStorage<T extends { [key: string]: any }>(key: T): Promise<T>;
function getFromStorage<T>(key: string | string[]): Promise<T>;
function getFromStorage<T>(key: string | string[] | { [key: string]: any }) {
  return sendMessage<T>('getStorage', { get: key }); 
}

const defaults = {
  playbackChange: 0.1,
  autoplay: false,
  volumeEnabled: false,
  volumeChange: 0.1,
  volumeLog: false,
  visitedColor: '',
};

export const init = async () => {
  const { playbackChange, autoplay, volumeEnabled, volumeChange, volumeLog, visitedColor } = await getFromStorage(defaults);
  console.debug('playbackChange:', playbackChange, 'autoplay?', autoplay,
    '\nvolume scroll?', volumeEnabled, 'change:', volumeChange, 'log?', volumeLog,
    '\nvisitedColor:', visitedColor);
  
  await waitForVJS();
  await registerComponents(playbackChange);
  setPlayerDefaults(autoplay, volumeEnabled);

  document.addEventListener('keydown', keydownHandler.bind(null, playbackChange));
  if (volumeEnabled)
    document.addEventListener('wheel', wheelHandler.bind(null, volumeChange, volumeLog), { passive: false });
  document.addEventListener(`${loadPrefix}-video`, initPlayer);
  initDispatch();

  sendEventHandler('queueChange', ({ canNext, canPrev }: { canNext: boolean, canPrev: boolean }) => updatePlayerControls(findAPlayer(), canNext, canPrev));

  const c = visitedColor.split(';')[0];
  if (!c) return;
  const s = document.createElement('style');
  s.innerHTML = `:root { --visited-color: ${c}; }`;
  document.head.appendChild(s);
  document.body.classList.add('style-visited');
};

export const initPlayer = async () => {
  const player = await getAPlayer();

  if (!player || player._enhancer_init)
    return; // already initialized this player
  
  const { autoplay } = await getFromStorage(defaults);

  if (autoplay)
    player.play();

  player.on('ended', () => {
    sendMessage('queueGotoNext', null, false);
  });

  const { canNext, canPrev } = await sendMessage<{ canNext: boolean, canPrev: boolean }>('getQueueStatus');
  updatePlayerControls(player, canNext, canPrev);
  
  player._enhancer_init = true;
};

export const waitForVJS = () => new Promise<typeof window.videojs>(resolve => {
  const i = window.setInterval(() => {
    if (window.videojs) {
      window.clearInterval(i);
      resolve(window.videojs);
    }
  }, 100);
});

export const findAPlayer = () => {
  if (!window.videojs || !window.videojs.players)
    return undefined;
  const player = document.querySelector('.video-js');
  if (!player)
    return undefined;
  return window.videojs.players[player.id];
};

export const getAPlayer = (maxiter: number | null = 10) => new Promise<VPlayer>((resolve, reject) => {
  let iter = 0;
  const i = window.setInterval(() => {
    if (maxiter !== null && iter++ > maxiter) {
      window.clearInterval(i);
      reject('No player found');
      return;
    }
    const player = findAPlayer();
    if (player) {
      window.clearInterval(i);
      resolve(player);
    }
  }, 100);
});

const registerComponents = async (playbackChange: number) => {
  console.debug('registering video components');
  window.videojs.registerComponent('SpeedDial', await SpeedDial(playbackChange));
  window.videojs.registerComponent('VolumeText', VolumeText());
  window.videojs.registerComponent('QueueNext', await QueueButton(true));
  window.videojs.registerComponent('QueuePrev', await QueueButton(false));
};

const setPlayerDefaults = (autoplay: boolean, volumeEnabled: boolean) => {
  window.videojs.options.autoplay = autoplay;

  const comps = window.videojs.getComponent('controlBar').prototype.options_.children;

  comps.push('speedDial');

  if (volumeEnabled) {
    const vidx = comps.findIndex(c => c === 'volumePanel');
    comps.splice(vidx + 1, 0, 'volumeText');
  }

  const pidx = comps.findIndex(c => c === 'playToggle');
  comps.splice(pidx + 1, 0, 'queueNext');
  comps.splice(pidx, 0, 'queuePrev');
};

const updatePlayerControls = (player: VPlayer, canNext: boolean, canPrev: boolean) => {
  if (!player) return;
  console.debug('canGoNext?', canNext, 'canGoPrev?', canPrev);
  (player.controlBar.getChild('QueueNext') as Instance<Comp<typeof QueueButton>>).toggle(canNext);
  (player.controlBar.getChild('QueuePrev') as Instance<Comp<typeof QueueButton>>).toggle(canPrev);
};

const keydownHandler = (playbackChange: number, e: KeyboardEvent) => {
  if (e.altKey || e.ctrlKey || e.metaKey)
    return;
  if (document.activeElement.tagName === 'INPUT')
    return;
  const pressedKey = e.key;
  const player = findAPlayer();
  if (!player)
    return;

  switch (pressedKey) {
    case ',':
      player.currentTime(player.currentTime() - 0.03); // "frame" back
      break;
    case '.':
      player.currentTime(player.currentTime() + 0.03); // "frame" forward
      break;
    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
      player.currentTime(player.duration() * (+pressedKey) / 10);
      break;
    case 'Home':
      player.currentTime(0);
      break;
    case 'End':
      player.currentTime(player.duration());
      break;
    case '<':
      player.playbackRate(Math.round((player.playbackRate() - playbackChange) * 100) / 100);
      break;
    case '>':
      player.playbackRate(Math.round((player.playbackRate() + playbackChange) * 100) / 100);
      break;
    case 'n':
      sendMessage('queueGotoNext', null, false);
      break;
    case 'p':
      sendMessage('queueGotoPrev', null, false);
      break;
    default:
      return;
  }
  e.stopPropagation();
  e.preventDefault();
};

const wheelHandler = async (volumeChange: number, volumeLog: boolean, e: WheelEvent) => {
  const player = findAPlayer();
  if (!player)
    return;
  const target = e.target as HTMLElement;
  if (target.closest('.video-js') === null) // only consider sub-elements of player
    return;
  e.stopPropagation();
  e.preventDefault();

  // use x^4 as approximation for logarithmic scale (https://www.dr-lex.be/info-stuff/volumecontrols.html)
  // using x^2 now because x^4 is too aggressive for this range
  const pow = 2;
  const cur = volumeLog ? Math.pow(player.volume(), 1 / pow) : player.volume(); // 4th root
  const v = cur - Math.sign(e.deltaY) * volumeChange;
  const n = volumeLog ? Math.pow(Math.max(v, 0), pow) : v; // if log, also take care that it's not negative (x^2 increases again below x=0)
  player.volume(e.deltaY * volumeChange > 0 && n < 0.01 ? 0 : n); // lower volume and below threshold -> mute
};
