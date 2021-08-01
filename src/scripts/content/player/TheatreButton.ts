import { sendEvent, sendMessage, TheatreClasses } from "../../helpers/sharedPage";

const TheatreButton = () => {
  const Button = window.THEOplayer.videojs.getComponent("MenuButton");
  // @ts-ignore
  return window.THEOplayer.videojs.extend(Button, {
    constructor: function () {
      Button.apply(this, arguments as FnArgs<typeof Button>);
      this.tooltipSpan = document.createElement("span");
      this.tooltipSpan.className = "theo-button-tooltip vjs-hidden";
      let text = '';
      sendEvent('getMessage', { message: 'playerTheatre' }).then((message: string) => text = message);
      const updateTooltip = () => {
        setTimeout(() => {
          this.tooltipSpan.innerText = text;
          const c = window.getComputedStyle(this.tooltipSpan, null);
          const w = (+c.getPropertyValue('width').slice(0, -2)) - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight);
          this.tooltipSpan.style.left = `${-w / 2}px`;
        }, 0);
      };
      const toggleTooltip = () => {
        this.tooltipSpan.classList.toggle("vjs-hidden");
        updateTooltip();
      };
      this.el().addEventListener("mouseover", toggleTooltip);
      this.el().addEventListener("mouseout", toggleTooltip);
      this.el().appendChild(this.tooltipSpan);
      updateTooltip();
    },
    handleClick: () => {
      sendMessage('toggleTheatreMode', null, false);
    },
    buildCSSClass: function () {
      return TheatreClasses;
    }
  });
}
export default TheatreButton;