import iconSpeed from '../../../icons/speed.svg';
import { Message, sendMessage } from '../../helpers/shared';
import type { Player } from '../player';
import { newButton } from './htmlhelper';
import { Tooltip } from './tooltip';

const createSpeedDial = async (player: Player, options: { playbackChange: number; }) => {
  const speedMsg = `${await sendMessage(Message.GET_MESSAGE, { message: 'playerNewSpeed' })}:`;
  const speed = await sendMessage(Message.GET_MESSAGE, { message: 'playerSpeed' });

  const button = newButton(speed, iconSpeed);
  const tooltip = new Tooltip(button, 'speed').appendToPlayer(player);

  const updateTooltip = () => {
    tooltip.setText(`${speed}: ${player.playbackRate}`);
  };
  const updatePlaybackrate = (rate: number) => {
    player.playbackRate = rate;
    window.localStorage.setItem('player-v2-speed', `${rate}`);
    setTimeout(updateTooltip, 0);
  };

  const toggleTooltip = (force?: boolean) => {
    tooltip.toggle(force);
    updateTooltip();
  };
  const scroll = (e: WheelEvent) => {
    e.stopPropagation();
    e.preventDefault();
    updatePlaybackrate(Math.round((player.playbackRate - Math.sign(e.deltaY) * options.playbackChange) * 100) / 100);
  };
  const click = () => {
    const ret = window.prompt(speedMsg, `${player.playbackRate}`);
    const r = +ret;
    if (ret !== null && !isNaN(r))
      updatePlaybackrate(r);
  };
  button.addEventListener('mouseenter', toggleTooltip.bind(undefined, true));
  button.addEventListener('mouseleave', toggleTooltip.bind(undefined, false));
  button.addEventListener('wheel', scroll, { passive: false });
  button.addEventListener('click', click);
  window.addEventListener('resize', updateTooltip);
  return button;
};
export default createSpeedDial;