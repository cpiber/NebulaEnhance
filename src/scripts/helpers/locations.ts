import { isVideoListPage } from './shared';

export const queueBottonLocation = (img: HTMLImageElement) => img.parentElement.parentElement;
export const durationLocation = (img: HTMLImageElement) => img.parentElement.nextElementSibling;
export const titleLocation = (link: HTMLElement) => link.nextElementSibling?.lastElementChild?.firstElementChild;
export const creatorLocation = (link: HTMLElement) => isVideoListPage() ? link.nextElementSibling?.lastElementChild?.lastElementChild?.firstElementChild : document.querySelector('h2');
export const creatorLink = (video: HTMLElement) => isVideoListPage() ? video.nextElementSibling?.firstElementChild?.getAttribute('href') : null;