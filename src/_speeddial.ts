import { sendEvent, SpeedClasses } from "./_shared";

const SpeedDial = (playbackRate: number, playbackChange: number) => {
    const Button = window.THEOplayer.videojs.getComponent("Button");
    // @ts-ignore
    const SpeedDial = window.THEOplayer.videojs.extend(Button, {
        constructor: function() {
            Button.apply(this, arguments);
            this.tooltipSpan = document.createElement("span");
            this.tooltipSpan.className = "theo-button-tooltip vjs-hidden";
            let speed = '';
            sendEvent('getMessage', { message: 'playerSpeed' }).then((message: string) => speed = message);
            const updateTooltip = () => {
                setTimeout(() => {
                    this.tooltipSpan.innerText = `${speed}: ${window.theoplayer.playbackRate}`;
                    const c = window.getComputedStyle(this.tooltipSpan, null);
                    const w = (+c.getPropertyValue('width').slice(0, -2)) - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight);
                    this.tooltipSpan.style.left = `${-w / 2}px`;
                }, 0);
            };
            const toggleTooltip = () => {
                this.tooltipSpan.classList.toggle("vjs-hidden");
                updateTooltip();
            };
            const scroll = (e: WheelEvent) => {
                e.preventDefault();
                window.theoplayer.playbackRate = Math.round((window.theoplayer.playbackRate - Math.sign(e.deltaY) * playbackChange) * 100) / 100;
                updateTooltip();
            };
            this.el().addEventListener("mouseover", toggleTooltip);
            this.el().addEventListener("mouseout", toggleTooltip);
            this.el().addEventListener("wheel", scroll);
            this.el().addEventListener("click", updateTooltip);
            this.el().appendChild(this.tooltipSpan);
            updateTooltip();
        },
        handleClick: () => {
            window.theoplayer.playbackRate = playbackRate;
        },
        buildCSSClass: function() {
            return SpeedClasses;
        }
    });
    return SpeedDial;
}
export default SpeedDial;