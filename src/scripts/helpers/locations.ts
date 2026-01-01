import { isVideoListPage } from './shared';

export const queueBottonLocation = (img: HTMLImageElement | HTMLTimeElement) => img.parentElement.parentElement;
export const durationLocation = (img: HTMLImageElement | HTMLTimeElement) => queueBottonLocation(img).querySelector('time').parentElement;
export const watchLaterLocation = (img: HTMLImageElement | HTMLTimeElement) => queueBottonLocation(img).querySelector('[data-icon-itself]');
export const titleLocation = (link: HTMLElement) => link.nextElementSibling ? link.nextElementSibling.querySelector('h3') : link.parentElement.nextElementSibling.querySelector('a[href^="/videos/"] span:last-child');
export const creatorLocation = (link: HTMLElement) => isVideoListPage() && link.nextElementSibling ? titleLocation(link).nextElementSibling.firstElementChild : document.querySelector('h1, meta[property="og:title"]');
export const watchProgressLocation = (link: HTMLElement) => link.querySelector('picture')?.parentElement?.lastElementChild as HTMLDivElement;
export const uploadTimeLocation = (link: HTMLElement) => link.nextElementSibling?.querySelector('time');
export const uploadDurationLocation = (link: HTMLElement) => link.querySelector('time');
export const isPlusContent = (link: HTMLElement) => !!link.querySelector('img[alt="Nebula Plus"]');
export const creatorLink = (video: HTMLElement) => isVideoListPage() ? video.nextElementSibling.firstElementChild.getAttribute('href') : null;
export const isWatchProgress = (el: HTMLElement) => el.tagName === 'DIV' && el.childElementCount === 1 && el.children[0].tagName === 'DIV' && el.children[0].childElementCount === 0;