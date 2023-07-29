import { isVideoListPage } from './shared';

export const queueBottonLocation = (img: HTMLImageElement) => img.parentElement.parentElement;
export const durationLocation = (img: HTMLImageElement) => queueBottonLocation(img).querySelector('time').parentElement;
export const watchLaterLocation = (img: HTMLImageElement) => queueBottonLocation(img).querySelector('[data-icon-itself]');
export const titleLocation = (link: HTMLElement) => link.nextElementSibling.querySelector('h3');
export const creatorLocation = (link: HTMLElement) => isVideoListPage() ? titleLocation(link).nextElementSibling.firstElementChild : document.querySelector('h2');
export const watchProgressLocation = (link: HTMLElement) => link.querySelector('picture')?.parentElement?.lastElementChild as HTMLDivElement;
export const uploadTimeLocation = (link: HTMLElement) => link.nextElementSibling?.querySelector('time');
export const uploadDurationLocation = (link: HTMLElement) => link.querySelector('time');
export const isPlusContent = (link: HTMLElement) => !!link.querySelector('img[alt="Nebula Plus"]');
export const creatorLink = (video: HTMLElement) => isVideoListPage() ? video.nextElementSibling.firstElementChild.getAttribute('href') : null;
export const isWatchProgress = (el: HTMLElement) => el.tagName === 'DIV' && el.childElementCount === 1 && el.children[0].tagName === 'DIV' && el.children[0].childElementCount === 0;