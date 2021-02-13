const videoselector = 'a[href^="/videos/"]';
import svg from "./icons/watchlater.svg";

export const nebula = () => {
    console.log('nebula', document.body);

    document.body.addEventListener('mouseover', hover);
    document.body.addEventListener('click', click);
};

const imgLink = (e: HTMLElement) => {
    // check if element is the image in a video link
    if (e.tagName !== 'IMG')
        return null;
    const link = e.closest(videoselector);
    if (link === null)
        return null;
    return link;
};
const hover = (e: MouseEvent) => {
    const link = imgLink(e.target as HTMLElement);
    if (link === null)
        return;
    const img = e.target as HTMLElement;
    if (img.parentElement.querySelector('.enhancer-queueButton') !== null)
        return; // queue button exists
    // create queue button
    const later = document.createElement('div');
    const time = img.nextElementSibling;
    later.innerHTML = `<span class="${time?.firstElementChild?.className}">Add to queue</span>${svg}`;
    later.className = `${time?.className} enhancer-queueButton`;
    img.parentElement.appendChild(later);
};

const click = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const later = target.closest('.enhancer-queueButton');
    if (later === null)
        return;
    const link = target.closest(videoselector);
    if (link === null)
        return;
    const img = later.parentElement.firstElementChild;
    // queue button clicked
    e.preventDefault();
    console.log(link, later);
}
