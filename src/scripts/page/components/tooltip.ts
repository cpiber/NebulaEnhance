
export class Tooltip {
  private tooltip: HTMLDivElement;
  private tooltipSpan: HTMLSpanElement;
  private keySpan: HTMLSpanElement;
  private parent: () => Element;

  constructor(parent: Element | (() => Element), classes?: string, text?: string) {
    this.tooltip = this.constructTooltip(text);
    this.tooltip.className = `enhancer-tooltip vjs-hidden ${classes}`;
    this.tooltipSpan = this.tooltip.querySelector('.vjs-nebula-tooltip-label');
    this.keySpan = this.tooltip.querySelector('.vjs-nebula-tooltip-key');
    this.parent = parent instanceof Element ? () => parent : parent;
  }

  appendTo(e: Element) {
    e.appendChild(this.tooltip);
    return this;
  }

  remove() {
    this.tooltip.remove();
    this.tooltip = null;
    this.tooltipSpan = null;
    return this;
  }

  setText(text: string) {
    this.tooltipSpan.innerText = text;
    this.update();
    return this;
  }

  setKey(text: string) {
    this.keySpan.innerText = `(${text})`;
    this.update();
    return this;
  }

  update() {
    const w = +window.getComputedStyle(this.parent()).width.slice(0, -2);
    const ownw = +window.getComputedStyle(this.tooltip).width.slice(0, -2);
    const center = (this.parent() as HTMLElement).offsetLeft + w / 2;
    let left = Math.max(center - ownw / 2, 12);
    if (this.parent().parentElement) {
      const pw = +window.getComputedStyle(this.parent().parentElement).width.slice(0, -2);
      this.tooltip.style.maxWidth = `${pw - 24}px`;
      if (left + ownw > pw - 12)
        left = pw - ownw - 12;
    }
    this.tooltip.style.left = `${left}px`;
    return this;
  }

  get classList() {
    return this.tooltip.classList;
  }

  private constructTooltip(text: string) {
    const tooltip = document.createElement('div');
    const box = tooltip.appendChild(document.createElement('div'));
    box.className = 'tippy-box';
    const content = box.appendChild(document.createElement('div'));
    content.className = 'tippy-content';
    const label = content.appendChild(document.createElement('span'));
    label.className = 'vjs-nebula-tooltip-label';
    label.textContent = text;
    content.append(' ');
    const key = content.appendChild(document.createElement('span'));
    key.className = 'vjs-nebula-tooltip-key';
    return tooltip;
  }
}