import type { Player } from '../player';
import { findTime } from './htmlhelper';

export const toggleVolumeShow = (player: Player, volumeShow: boolean) => {
  player.parentElement.querySelector('.enhancer-volume').classList.toggle('volume-conditional', !volumeShow);
  player.parentElement.querySelector('#volume-controller, #volume-controller-conditional').id = !volumeShow ? 'volume-controller-conditional' : 'volume-controller';
};

const attachVolumeText = (player: Player, controls: NodeListOf<Element>, options: { volumeShow: boolean; }) => {
  const volume = player.parentElement.querySelector('#volume-toggle-button').parentElement;
  player.querySelector('.enhancer-volume')?.remove();
  const text = document.createElement('div');
  text.className = findTime(controls).className;
  text.classList.toggle('enhancer-hidden', volume.classList.contains('enhancer-hidden'));
  text.classList.add('enhancer-volume');
  if (!options.volumeShow) {
    text.classList.add('volume-conditional');
    volume.id = 'volume-controller-conditional';
  } else {
    volume.id = 'volume-controller';
  }

  const updateVolume = () => text.textContent = `${(player.volume * 100).toFixed(0)}%`;
  player.addEventListener('volumechange', updateVolume);
  updateVolume();
  volume.appendChild(text);
  return text;
};
export default attachVolumeText;