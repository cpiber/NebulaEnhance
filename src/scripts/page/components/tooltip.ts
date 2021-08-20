
export class Tooltip {
  private tooltip: HTMLDivElement;
  private tooltipSpan: HTMLSpanElement;
  private parent: () => Element;

  constructor(parent: Element | (() => Element), text?: string) {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'enhancer-tooltip vjs-hidden';
    this.tooltip.innerHTML = `<div class="tippy-box"><div class="tippy-content"><span class="vjs-nebula-tooltip-label">${text || ''}</span><span class="vjs-nebula-tooltip-key"></span></div></div>`;
    this.tooltipSpan = this.tooltip.querySelector('.vjs-nebula-tooltip-label');
    this.parent = parent instanceof Element ? () => parent : parent;
  }

  appendTo(e: Element) {
    e.appendChild(this.tooltip);
  }

  remove() {
    this.tooltip.remove();
    this.tooltip = null;
    this.tooltipSpan = null;
  }

  setText(text: string) {
    this.tooltipSpan.innerText = text;
    this.update();
  }

  update() {
    const w = +window.getComputedStyle(this.parent()).width.slice(0, -2);
    this.tooltip.style.left = `${(this.parent() as HTMLElement).offsetLeft + w/2}px`;
  }

  get classList() {
    return this.tooltip.classList;
  }
}