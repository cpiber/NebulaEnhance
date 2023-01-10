import type { Player } from '../player';

// taken from: https://nebula.tv/static/js/components/VideoPlayer/events.ts
class VideoCurrentTimeUpdateEvent extends CustomEvent<{ currentTime: number; }> {
  constructor(currentTime: number) {
    super('videoCurrentTimeUpdate', {
      detail: { currentTime },
    });
  }
}
// taken from: https://nebula.tv/static/js/utils/date/formatTime.ts
export const formatTime = (seconds: number) => {
  const sign = seconds < 0 ? '-' : '';
  if (seconds < 0) seconds = -seconds;
  const hours = Math.floor(seconds / (60 * 60));
  const minutes = Math.floor((seconds - hours * (60 * 60)) / 60);
  const restSeconds = Math.floor(seconds - hours * 60 * 60 - minutes * 60);
  if (hours > 0) return `${sign}${hours}:${minutes.toString().padStart(2, '0')}:${restSeconds.toString().padStart(2, '0')}`;
  return `${sign}${minutes.toString().padStart(2, '0')}:${restSeconds.toString().padStart(2, '0')}`;
};

const attachTime = (player: Player, controls: NodeListOf<Element>) => {
  const time = controls[0].lastElementChild;
  const currentTime = (time.firstElementChild as HTMLElement);
  const remainingTime = time.firstElementChild.cloneNode() as HTMLElement;
  currentTime.classList.add('enhancer-time-current');
  remainingTime.classList.add('enhancer-time-remaining');
  time.classList.add('enhancer-hide-remaining', 'enhancer-time');
  time.prepend(remainingTime);
  time.addEventListener('click', () => {
    time.classList.toggle('enhancer-hide-current');
    time.classList.toggle('enhancer-hide-remaining');
  });
  document.addEventListener('videoCurrentTimeUpdate', (e: VideoCurrentTimeUpdateEvent) => {
    remainingTime.innerHTML = formatTime(e.detail.currentTime - player.duration);
  });
};
export default attachTime;