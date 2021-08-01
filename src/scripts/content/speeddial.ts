import type { VideoJsPlayer } from "video.js";
import { isMobile } from "../helpers/shared";
import { sendMessage } from "../helpers/sharedPage";

type Instance<T> = T extends new (...args: any[]) => infer U ? U : never;
type Dial = {
  tooltip: HTMLElement,
  tooltipSpan: HTMLElement,
  updateTooltip: () => void,
  updatePlaybackrate: (n: number) => void,
};

const SpeedDial = async (player: VideoJsPlayer, playbackChange: number) => {
  const speedMsg = `${await sendMessage('getMessage', { message: 'playerNewSpeed' })}:`;
  const speed = await sendMessage('getMessage', { message: 'playerSpeed' });
  
  const MenuButton = window.videojs.getComponent("MenuButton");
  return window.videojs.extend(MenuButton, {
    constructor: function (this: Instance<typeof MenuButton> & Dial) {
      MenuButton.apply(this, arguments as FnArgs<typeof MenuButton>);
      
      this.tooltip = document.createElement("div");
      this.tooltip.className = "enhancer-tooltip vjs-hidden";
      this.tooltip.innerHTML = `<div class="tippy-box"><div class="tippy-content"><span class="vjs-nebula-tooltip-label"></span><span class="vjs-nebula-tooltip-key"></span></div></div>`;
      this.tooltipSpan = this.tooltip.querySelector('span');
      this.controlText(speed);
      
      const toggleTooltip = (force?: boolean) => {
        this.tooltip.classList.toggle("vjs-hidden", force);
        this.updateTooltip();
      };
      const scroll = (e: WheelEvent) => {
        e.preventDefault();
        this.updatePlaybackrate(Math.round((player.playbackRate() - Math.sign(e.deltaY) * playbackChange) * 100) / 100);
      };
      this.el().addEventListener("mouseenter", toggleTooltip.bind(this, false));
      this.el().addEventListener("mouseleave", toggleTooltip.bind(this, true));
      this.el().addEventListener("wheel", scroll.bind(this));
      window.addEventListener("resize", this.updateTooltip.bind(this));
      this.player().el().appendChild(this.tooltip);
      this.updateTooltip();
    },
    handleClick: function (this: Instance<typeof MenuButton> & Dial) {
      const mobile = isMobile();
      // console.debug(mobile, mobile ? 'Android' : 'Other');

      if (mobile) {
        const ret = window.prompt(speedMsg, `${player.playbackRate()}`);
        const r = +ret;
        if (ret !== null && !isNaN(r))
          this.updatePlaybackrate(r);
      }
    },
    updateTooltip: function (this: Instance<typeof MenuButton> & Dial) {
      this.tooltipSpan.innerText = `${speed}: ${player.playbackRate()}`;
      const w = +window.getComputedStyle(this.el()).width.slice(0, -2);
      this.tooltip.style.left = `${(this.el() as HTMLElement).offsetLeft + w/2}px`;
    },
    updatePlaybackrate: function (this: Instance<typeof MenuButton> & Dial, rate: number) {
      player.playbackRate(rate);
      window.localStorage.setItem('player-v1-speed', `${rate}`);
      this.setTimeout(this.updateTooltip.bind(this), 0);
    },
    buildCSSClass: function (this: Instance<typeof MenuButton> & Dial) {
      return `vjs-icon-circle-inner-circle enhancer-speed ${MenuButton.prototype.buildCSSClass.apply(this)}`;
    }
  });
}
export default SpeedDial;