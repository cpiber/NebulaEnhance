import { isMobile, sendMessage } from '../../helpers/shared';
import { Tooltip } from './tooltip';

type Dial = {
  tooltip: Tooltip,
  updateTooltip: () => void,
  updatePlaybackrate: (n: number) => void,
};

const SpeedDial = async (playbackChange: number) => {
  const speedMsg = `${await sendMessage<string>('getMessage', { message: 'playerNewSpeed' })}:`;
  const speed = await sendMessage<string>('getMessage', { message: 'playerSpeed' });
  
  const MenuButton = window.videojs.getComponent('MenuButton');
  type T = Instance<typeof MenuButton> & Dial;
  return window.videojs.extend(MenuButton, {
    constructor: function (this: T) {
      MenuButton.apply(this, arguments as FnArgs<typeof MenuButton>);
      
      this.tooltip = new Tooltip(this.el.bind(this), 'speed');
      this.controlText(speed);
      
      const toggleTooltip = (force?: boolean) => {
        this.tooltip.classList.toggle('vjs-hidden', force);
        this.updateTooltip();
      };
      const scroll = (e: WheelEvent) => {
        e.stopPropagation();
        e.preventDefault();
        this.updatePlaybackrate(Math.round((this.player().playbackRate() - Math.sign(e.deltaY) * playbackChange) * 100) / 100);
      };
      this.el().addEventListener('mouseenter', toggleTooltip.bind(this, false));
      this.el().addEventListener('mouseleave', toggleTooltip.bind(this, true));
      this.el().addEventListener('wheel', scroll.bind(this), { passive: false });
      window.addEventListener('resize', this.updateTooltip.bind(this));
      this.tooltip.appendTo(this.player().el());
      this.updateTooltip();
    },
    handleClick: function (this: T) {
      const mobile = isMobile();
      // console.debug(mobile, mobile ? 'Android' : 'Other');

      if (mobile) {
        const ret = window.prompt(speedMsg, `${this.player().playbackRate()}`);
        const r = +ret;
        if (ret !== null && !isNaN(r))
          this.updatePlaybackrate(r);
      }
    },
    updateTooltip: function (this: T) {
      if (!this.el())
        return;
      this.tooltip.setText(`${speed}: ${this.player().playbackRate()}`);
    },
    updatePlaybackrate: function (this: T, rate: number) {
      this.player().playbackRate(rate);
      window.localStorage.setItem('player-v1-speed', `${rate}`);
      this.setTimeout(this.updateTooltip.bind(this), 0);
    },
    dispose: function (this: T) {
      this.tooltip.remove();
      MenuButton.prototype.dispose.apply(this);
    },
    buildCSSClass: function (this: T) {
      return `vjs-icon-circle-inner-circle enhancer-speed ${MenuButton.prototype.buildCSSClass.apply(this)}`;
    },
  });
};
export default SpeedDial;