import type { Player } from '../player';

export class Tooltip {
  private tooltip: HTMLDivElement;
  private tooltipSpan: HTMLSpanElement;
  private keySpan: HTMLSpanElement;
  private parent: () => Element;

  constructor(parent: Element | (() => Element), classes?: string, text?: string) {
    this.tooltip = this.constructTooltip(text);
    this.tooltip.className = `enhancer-tooltip hidden ${classes}`;
    document.querySelector(this.tooltip.className.replace(' hidden ', ' ').replace(/^| +/g, '.'))?.remove();
    this.tooltipSpan = this.tooltip.querySelector('.tooltip-label');
    this.keySpan = this.tooltip.querySelector('.tooltip-key');
    this.parent = parent instanceof Element ? () => parent : parent;

    this.tooltip.addEventListener('animationend', () => {
      const washiding = this.tooltip.classList.contains('hide-anim');
      this.tooltip.classList.remove('show-anim', 'hide-anim');
      if (washiding) this.tooltip.classList.add('hidden');
    });
  }

  appendTo(e: Element) {
    e.appendChild(this.tooltip);
    return this;
  }
  appendToPlayer(player: Player) {
    return this.appendTo(player.parentElement.querySelector('#video-controls'));
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
    const left = Math.max(center - ownw / 2, 12);
    this.tooltip.style.left = `${left}px`;
    return this;
  }

  toggle(force?: boolean) {
    const washidden = this.tooltip.classList.contains('hidden');
    const show = washidden || force === true;
    this.tooltip.classList.remove('show-anim', 'hide-anim', 'hidden');

    if (show) {
      this.update();
      setTimeout(() => this.update(), 50);
    }
    this.tooltip.classList.add(show ? 'show-anim' : 'hide-anim');
    return this;
  }

  private constructTooltip(text: string) {
    const tooltip = document.createElement('div');
    const box = tooltip.appendChild(document.createElement('div'));
    box.className = 'tippy-box';
    const content = box.appendChild(document.createElement('div'));
    content.className = 'tippy-content';
    const label = content.appendChild(document.createElement('span'));
    label.className = 'tooltip-label';
    label.textContent = text;
    content.append(' ');
    const key = content.appendChild(document.createElement('span'));
    key.className = 'tooltip-key';
    return tooltip;
  }
}