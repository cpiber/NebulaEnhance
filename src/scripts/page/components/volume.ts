import type { VolumePanel } from '../../../types/videojs';

type Control = {
  timeout: number;
  updateTextNode_: () => void;
  show: () => void;
};

const VolumeText = (options: { volumeShow: boolean; }) => {
  const TimeDisplay = window.videojs.getComponent('TimeDisplay');
  type T = InstanceType<typeof TimeDisplay> & Control;
  return window.videojs.extend(TimeDisplay, {
    timeout: null,
    constructor(this: T) {
      TimeDisplay.apply(this, arguments as FnArgs<typeof TimeDisplay>);
      this.on(this.player(), ['volumechange'], this.updateTextNode_.bind(this));

      if (!options.volumeShow)
        this.addClass('volume-conditional');

      // avoid the control closing on hover over percentage
      let v: VolumePanel;
      const getVolumeControl = () => v = (v || this.player().controlBar?.getChild('VolumePanel') as VolumePanel);
      this.on('mouseover', e => getVolumeControl().handleMouseOver(e));
      this.on('mouseout', e => getVolumeControl().handleMouseOut(e));
    },
    buildCSSClass(this: T) {
      return `enhancer-volume ${TimeDisplay.prototype.buildCSSClass.apply(this)} volume`;
    },
    updateTextNode_(this: T) {
      // hijack TimeDisplay's private updating mechanism
      this.contentEl().textContent = `${(this.player().volume() * 100).toFixed(0)}%`;
    },
    show(this: T) {
      window.clearTimeout(this.timeout);
      this.addClass('volume-show');
      this.timeout = window.setTimeout(() => this.removeClass('volume-show'), 1200);
    },
    setShown(this: T, show: boolean) {
      this.toggleClass('volume-conditional', !show);
    },
  });
};
export default VolumeText;