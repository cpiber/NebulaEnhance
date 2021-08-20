import type { VideoJsPlayer } from 'video.js';
import { sendMessage } from '../helpers/shared';
import { init as initDispatch, loadPrefix } from './dispatcher';
import SpeedDial from './components/speeddial';
import VolumeText from './components/volume';
import QueueButton from './components/queue';

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
  const { playbackChange, volumeEnabled, volumeChange, volumeLog, visitedColor } = await getFromStorage(defaults);
  console.debug('playbackChange:', playbackChange,
    '\nvolume scroll?', volumeEnabled, 'change:', volumeChange, 'log?', volumeLog,
    '\nvisitedColor:', visitedColor);

  document.addEventListener('keydown', keydownHandler.bind(null, playbackChange));
  if (volumeEnabled)
    document.addEventListener('wheel', wheelHandler.bind(null, volumeChange, volumeLog), { passive: false });
  document.addEventListener(`${loadPrefix}-video`, initPlayer);
  initDispatch();

  const c = visitedColor.split(';')[0];
  if (!c) return;
  const s = document.createElement('style');
  s.innerHTML = `:root { --visited-color: ${c}; }`;
  document.head.appendChild(s);
  document.body.classList.add('style-visited');
};

export const initPlayer = async () => {
  const player = await getAPlayer();

  if (!player || player.controlBar.children().find(c => c.name() === 'SpeedDial'))
    return; // already initialized this player
  
  const { playbackChange, autoplay, volumeEnabled } = await getFromStorage(defaults);
  console.debug('playbackChange:', playbackChange, 'autoplay?', autoplay);

  window.videojs.options.autoplay = autoplay; // set default
  player.autoplay(autoplay);
  if (autoplay)
    player.play();
  
  if (window.videojs.getComponent('SpeedDial') === undefined)
    await registerComponents(playbackChange);
  
  player.controlBar.addChild('SpeedDial', {});

  const vidx = player.controlBar.children().findIndex(c => c.name() === 'VolumePanel');
  if (volumeEnabled)
    player.controlBar.addChild('VolumeText', {}, vidx + 1);

  player.on('ended', () => {
    sendMessage('queueGotoNext', null, false);
  });

  const { canNext, canPrev } = await sendMessage<{ canNext: boolean, canPrev: boolean }>('getQueueStatus');
  const pidx = player.controlBar.children().findIndex(c => c.name() === 'PlayToggle');
  if (canNext)
    player.controlBar.addChild('QueueNext', {}, pidx + 1);
  if (canPrev)
    player.controlBar.addChild('QueuePrev', {}, pidx);
};

export const findAPlayer = () => {
  if (!window.videojs || !window.videojs.players)
    return undefined;
  const player = document.querySelector('.video-js');
  if (!player)
    return undefined;
  return window.videojs.players[player.id];
};

export const getAPlayer = (maxiter: number | null = 10) => new Promise<VideoJsPlayer>((resolve, reject) => {
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
  const n = volumeLog ? Math.pow(v, pow) : v;
  player.volume(e.deltaY * volumeChange > 0 && n < 0.01 ? 0 : n); // lower volume and below threshold -> mute
};
