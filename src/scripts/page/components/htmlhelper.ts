import { arrFromLengthy } from '../sharedpage';

const strToSVG = (str: string): SVGSVGElement => document.createRange().createContextualFragment(str).querySelector('svg');

export const newButton = (label: string, id: string, icon: SVGSVGElement | string, ...classes: string[]) => {
  const b = document.getElementById('fullscreen-mode-button').cloneNode(true) as HTMLElement;
  b.id = id;
  b.removeAttribute('data-shortcuts');
  b.classList.add(...classes);
  b.setAttribute('aria-label', label);
  if (typeof icon === 'string') icon = strToSVG(icon);
  const svg = b.firstElementChild as SVGSVGElement;
  svg.replaceChildren(...arrFromLengthy(icon.children));
  svg.setAttribute('viewBox', icon.getAttribute('viewBox'));
  return b;
};

export const findTime = (controls: NodeListOf<Element>): HTMLElement => {
  for (const side of Array.from(controls)) {
    for (const comp of Array.from(side.childNodes)) {
      if (comp.childNodes.length === 3 && (comp.childNodes[1] as HTMLElement).innerHTML === '&nbsp;/&nbsp;') return comp as HTMLElement;
    }
  }
  return null;
};