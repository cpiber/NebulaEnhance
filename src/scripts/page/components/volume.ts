import type { Player } from '../player';

export const toggleVolumeShow = (player: Player, volumeShow: boolean) =>
  player.parentElement.querySelector('.enhancer-volume').classList.toggle('volume-conditional', !volumeShow);

const attachVolumeText = (player: Player, controls: NodeListOf<Element>, options: { volumeShow: boolean; }) => {
  const volume = controls[0].children[1] as HTMLElement;
  const text = document.createElement('div');
  text.className = controls[0].lastElementChild.className;
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