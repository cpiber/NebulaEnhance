import type { Player } from '../player';
import { findTime } from './htmlhelper';

export const toggleVolumeShow = (player: Player, volumeShow: boolean) =>
  player.parentElement.querySelector('.enhancer-volume').classList.toggle('volume-conditional', !volumeShow);

const attachVolumeText = (player: Player, controls: NodeListOf<Element>, options: { volumeShow: boolean; }) => {
  const volume = player.parentElement.querySelector('#volume-toggle-button').parentElement;
  player.querySelector('.enhancer-volume')?.remove();
  const text = document.createElement('div');
  text.className = findTime(controls).className;
  text.classList.toggle('enhancer-hidden', volume.classList.contains('enhancer-hidden'));
  text.classList.add('enhancer-volume');
  volume.classList.add('enhancer-volume-controller');
  if (!options.volumeShow)
    text.classList.add('volume-conditional');

  const updateVolume = () => text.textContent = `${(player.volume * 100).toFixed(0)}%`;
  player.addEventListener('volumechange', updateVolume);
  updateVolume();
  volume.after(text);
  return text;
};
export default attachVolumeText;