import { sendMessage, SpeedClasses } from "../../helpers/sharedPage";

const SpeedClick = () => {
  const Button = window.THEOplayer.videojs.getComponent("MenuButton");
  let speed = '';
  sendMessage('getMessage', { message: 'playerNewSpeed' }).then((message: string) => speed = `${message}:`);
  // @ts-ignore
  return window.THEOplayer.videojs.extend(Button, {
    constructor: function () {
      Button.apply(this, arguments as FnArgs<typeof Button>);
    },
    handleClick: () => {
      const r = +window.prompt(speed, `${window.theoplayer.playbackRate}`);
      if (!isNaN(r))
        window.theoplayer.playbackRate = r;
    },
    buildCSSClass: function () {
      return SpeedClasses;
    }
  });
}
export default SpeedClick;