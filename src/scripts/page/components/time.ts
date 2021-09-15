
const Time = () => {
  const Component = window.videojs.getComponent('ClickableComponent');
  type T = Instance<typeof Component>;
  const comp = window.videojs.extend(Component, {
    constructor(this: T) {
      Component.apply(this, arguments as FnArgs<typeof Component>);
      this.children()[1].addClass('vjs-hidden');
    },
    handleClick(event) {
      event.preventDefault();
      this.children()[0].toggleClass('vjs-hidden');
      this.children()[1].toggleClass('vjs-hidden');
    },
    buildCSSClass() {
      return `enhancer-time ${Component.prototype.buildCSSClass.apply(this).replace('vjs-button', '')}`;
    },
  });
  comp.prototype.options_ = {
    children: [
      'currentTimeDisplay',
      'remainingTimeDisplay',
      'timeDivider',
      'durationDisplay',
    ],
  };
  return comp;
};
export default Time;