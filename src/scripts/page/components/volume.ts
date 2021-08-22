type Control = {
  updateTextNode_: () => void;
};

const VolumeText = () => {
  const TimeDisplay = window.videojs.getComponent('TimeDisplay');
  type T = Instance<typeof TimeDisplay> & Control;
  return window.videojs.extend(TimeDisplay, {
    constructor(this: T) {
      TimeDisplay.apply(this, arguments as FnArgs<typeof TimeDisplay>);
      this.on(this.player(), ['volumechange'], this.updateTextNode_.bind(this));
    },
    buildCSSClass(this: T) {
      return `enhancer-volume ${TimeDisplay.prototype.buildCSSClass.apply(this)}`;
    },
    updateTextNode_(this: T) {
      // hijack TimeDisplay's private updating mechanism
      this.contentEl().textContent = `${(this.player().volume() * 100).toFixed(0)}%`;
    },
  });
};
export default VolumeText;