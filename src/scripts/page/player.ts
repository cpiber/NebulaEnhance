import type { VideoJsPlayer } from "video.js";
import { isVideoPage, sendMessage } from "../helpers/shared";
import { init as initDispatch, loadPrefix } from './dispatcher';
import SpeedDial from "./speeddial";

function getFromStorage<T extends { [key: string]: any }>(key: T): Promise<T>;
function getFromStorage<T>(key: string | string[]): Promise<T>;
function getFromStorage<T>(key: string | string[] | { [key: string]: any }) { return sendMessage<T>('getStorage', { get: key }); }

const defaults = {
  playbackChange: 0.1,
  autoplay: false,
};

export const init = () => {
  document.addEventListener('keydown', getPressedKey);
  document.addEventListener(`${loadPrefix}-video`, initPlayer);
  initDispatch();
};

export const initPlayer = async () => {
  if (!isVideoPage())
    return;
  const player = await getAPlayer();

  if (!player || player.controlBar.children().find(c => c.name() === 'SpeedDial'))
    return; // already initialized this player
  
  const {
    playbackChange,
    autoplay,
  } = await getFromStorage(defaults);

  console.debug('playbackChange:', playbackChange, 'autoplay:', autoplay);
  player.autoplay(autoplay);
  if (autoplay)
    player.play();
  
  const comp = await SpeedDial(player, playbackChange);
  window.videojs.registerComponent("SpeedDial", comp);
  player.controlBar.addChild("SpeedDial", {});

  player.on('ended', () => {
    sendMessage('queueGotoNext', null, false);
  });
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
    }
    const player = findAPlayer();
    if (player) {
      window.clearInterval(i);
      resolve(player);
    }
  }, 100);
});

const getPressedKey = async (e: KeyboardEvent) => {
  if (e.altKey || e.ctrlKey || e.metaKey)
    return;
  if (document.activeElement.tagName === "INPUT")
    return;
  const pressedKey = e.key;
  const player = findAPlayer();
  if (!player)
    return;
  const { playbackChange } = await getFromStorage({ playbackChange: defaults.playbackChange });
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
    default:
      return;
  }
  e.stopPropagation();
  e.preventDefault();
};