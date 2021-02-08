const SpeedClick = () => {
    const Button = window.THEOplayer.videojs.getComponent("Button");
    // @ts-ignore
    const SpeedClick = window.THEOplayer.videojs.extend(Button, {
        constructor: function() {
            Button.apply(this, arguments);
        },
        handleClick: () => {
            window.theoplayer.playbackRate = +window.prompt('New speed:', `${window.theoplayer.playbackRate}`);
        },
        buildCSSClass: function() {
            return "vjs-icon-circle-inner-circle vjs-button vjs-control theo-controlbar-button";
        }
    });
    return SpeedClick;
}
export default SpeedClick;