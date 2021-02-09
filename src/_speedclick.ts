import { sendEvent, SpeedClasses } from "./_shared";

const SpeedClick = () => {
    const Button = window.THEOplayer.videojs.getComponent("Button");
    let speed = '';
    sendEvent('getMessage', { message: 'playerNewSpeed' }).then((message: string) => speed = `${message}:`);
    // @ts-ignore
    const SpeedClick = window.THEOplayer.videojs.extend(Button, {
        constructor: function() {
            Button.apply(this, arguments);
        },
        handleClick: () => {
            window.theoplayer.playbackRate = +window.prompt(speed, `${window.theoplayer.playbackRate}`);
        },
        buildCSSClass: function() {
            return SpeedClasses;
        }
    });
    return SpeedClick;
}
export default SpeedClick;