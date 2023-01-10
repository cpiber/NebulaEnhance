import type { Player } from '../player';

export const toggleVolumeShow = (control: HTMLElement, volumeShow: boolean) => control.classList.toggle('volume-conditional', !volumeShow);

const attachVolumeText = (player: Player, controls: NodeListOf<Element>, options: { volumeShow: boolean; }) => {
  const volume = controls[0].children[1] as HTMLElement;
  const text = document.createElement('div');
  text.className = controls[0].lastElementChild.className;
  text.classList.add('enhancer-volume');
  volume.classList.add('enhancer-volume-controller');
  if (!options.volumeShow)
    text.classList.add('volume-conditional');

  const updateTime = () => text.textContent = `${(player.volume * 100).toFixed(0)}%`;
  player.addEventListener('volumechange', updateTime);
  updateTime();
  volume.after(text);
  return text;
};
export default attachVolumeText;