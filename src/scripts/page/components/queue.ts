import { sendMessage } from '../../helpers/shared';
import { Tooltip } from './tooltip';

type Button = {
  tooltip: Tooltip,
};

const QueueButton = async (next: boolean) => {
  const click = next ? () => sendMessage('queueGotoNext', null, false) : () => sendMessage('queueGotoPrev', null, false);
  const text = await sendMessage<string>('getMessage', { message: `pageQueue${next? 'Next' : 'Prev'}` });

  const MenuButton = window.videojs.getComponent('MenuButton');
  type T = Instance<typeof MenuButton> & Button;
  return window.videojs.extend(MenuButton, {
    constructor: function (this: T) {
      MenuButton.apply(this, arguments as FnArgs<typeof MenuButton>);
      
      this.tooltip = new Tooltip(this.el.bind(this), `queue-${next ? 'next' : 'prev'}`, text);
      this.controlText(text);

      const toggleTooltip = (force: boolean) => {
        if (this.hasClass('vjs-disabled')) return;
        this.tooltip.classList.toggle('vjs-hidden', force);
        this.tooltip.update();
      };
      this.el().addEventListener('mouseenter', toggleTooltip.bind(this, false));
      this.el().addEventListener('mouseleave', toggleTooltip.bind(this, true));
      this.tooltip.appendTo(this.player().el()).setKey(next ? 'n' : 'p');
      this.disable();
    },
    handleClick: click,
    dispose: function (this: T) {
      this.tooltip.remove();
    },
    buildCSSClass: function (this: T) {
      return `vjs-icon-${next ? 'next-item' : 'previous-item'} enhancer-queue-control enhancer-queue-control-${next ? 'next' : 'prev'} ${MenuButton.prototype.buildCSSClass.apply(this)}`;
    },
  });
};
export default QueueButton;