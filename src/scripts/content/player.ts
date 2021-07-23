import { isMobile, isVideoPage } from "../helpers/shared";
import { sendEvent } from "../helpers/sharedPage";
import type { VideoJsPlayer } from "video.js";
import SpeedDial from "./speeddial";

function getFromStorage<T extends { [key: string]: any }>(key: T): Promise<T>;
function getFromStorage<T>(key: string | string[]): Promise<T>;
function getFromStorage<T>(key: string | string[] | { [key: string]: any }) { return sendEvent<T>('storageGet', { get: key }); }

const defaults = {
  playbackChange: 0.1,
  autoplay: false,
};

export const init = async () => {
  if (!isVideoPage())
    return;
  const player = await getAPlayer();
  
  const {
    playbackChange,
    autoplay,
  } = await getFromStorage(defaults);

  console.debug('playbackChange:', playbackChange, 'autoplay:', autoplay);
  player.autoplay(autoplay);

  if (player.controlBar.children().find(c => c.name() === 'SpeedDial'))
    return;
  
  const comp = SpeedDial(player, player.playbackRate(), playbackChange);
  window.videojs.registerComponent("SpeedDial", comp);
  player.controlBar.addChild("SpeedDial", {});
};

export const findAPlayer = () => {
  const key = Object.keys(window.videojs.players).find(k => !!window.videojs.players[k]);
  if (!key)
    return undefined;
  return window.videojs.players[key];
};

export const getAPlayer = () => new Promise<VideoJsPlayer>((resolve, reject) => {
  let iter = 0;
  const i = window.setInterval(() => {
    if (iter++ > 10) {
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
