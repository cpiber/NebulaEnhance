import iconNext from '../../../icons/next.svg';
import { Message, sendMessage } from '../../helpers/shared';
import type { Player } from '../player';
import { newButton } from './htmlhelper';
import { Tooltip } from './tooltip';

export const toggleQueueButton = (player: Player, next: boolean, enable: boolean) =>
  player.parentElement.querySelector(`.enhancer-queue-control-${next ? 'next' : 'prev'}`).classList.toggle('disabled', !enable);

const createQueueButton = async (player: Player, next: boolean) => {
  const click = next ? () => sendMessage(Message.QUEUE_NEXT, null, false) : () => sendMessage(Message.QUEUE_PREV, null, false);
  const text = await sendMessage(Message.GET_MESSAGE, { message: `pageQueue${next ? 'Next' : 'Prev'}` });

  const button = newButton(text, `queue-${next ? 'next' : 'prev'}`, iconNext, 'disabled', 'enhancer-queue-control', `enhancer-queue-control-${next ? 'next' : 'prev'}`);
  const tooltip = new Tooltip(button, `queue-${next ? 'next' : 'prev'}`, text).setKey(next ? 'n' : 'p').appendToPlayer(player);

  const toggleTooltip = (force?: boolean) => {
    if (button.classList.contains('disabled')) return;
    tooltip.toggle(force);
  };
  button.addEventListener('click', click);
  button.addEventListener('mouseenter', toggleTooltip.bind(undefined, true));
  button.addEventListener('mouseleave', toggleTooltip.bind(undefined, false));
  return button;
};
export default createQueueButton;