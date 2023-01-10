import { arrFromLengthy } from '../sharedpage';

const strToSVG = (str: string): SVGSVGElement => document.createRange().createContextualFragment(str).querySelector('svg');

export const newButton = (label: string, icon: SVGSVGElement | string, ...classes: string[]) => {
  const b = document.getElementById('theater-mode-button').cloneNode(true) as HTMLElement;
  b.removeAttribute('id');
  b.classList.add(...classes);
  b.setAttribute('aria-label', label);
  if (typeof icon === 'string') icon = strToSVG(icon);
  const svg = b.firstElementChild as SVGSVGElement;
  svg.replaceChildren(...arrFromLengthy(icon.children));
  svg.setAttribute('viewBox', icon.getAttribute('viewBox'));
  return b;
};