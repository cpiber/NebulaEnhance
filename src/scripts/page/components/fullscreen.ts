import iconExpand from '../../../icons/expand.svg';
import { Message, sendMessage } from '../../helpers/shared';
import type { Player } from '../player';
import { newButton } from './htmlhelper';
import { Tooltip } from './tooltip';

const createExpandButton = async (player: Player) => {
  const expand = await sendMessage(Message.GET_MESSAGE, { message: 'playerExpand' });

  const button = newButton(expand, 'expand', iconExpand);
  const tooltip = new Tooltip(button, 'expand', expand).appendToPlayer(player);

  const toggleTooltip = (force?: boolean) => {
    tooltip.toggle(force);
  };
  const click = () => {
    document.body.parentElement.classList.toggle('enhancer-fullVideo');
  };
  button.addEventListener('mouseenter', toggleTooltip.bind(undefined, true));
  button.addEventListener('mouseleave', toggleTooltip.bind(undefined, false));
  button.addEventListener('click', click);
  window.addEventListener('resize', tooltip.update.bind(tooltip));
  return button;
};
export default createExpandButton;