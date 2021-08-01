import { isVideoListPage } from './shared';

export const queueBottonLocation = (img: HTMLImageElement) => img.parentElement.parentElement;
export const durationLocation = (img: HTMLImageElement) => img.parentElement.nextElementSibling;
export const titleLocation = (link: HTMLElement) => isVideoListPage() ? link.lastElementChild?.children[1] : link.lastElementChild?.firstElementChild;
export const creatorLocation = (link: HTMLElement) => isVideoListPage() ? link.lastElementChild?.lastElementChild?.firstElementChild : document.querySelector('h2');