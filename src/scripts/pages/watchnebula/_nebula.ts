const videoselector = 'a[href^="/videos/"]';
import svg from "./../../../icons/watchlater.svg";
import { addToStore, enqueue, enqueueNow, gotoNextInQueue, init } from "./_queue";

export const nebula = () => {
    document.body.addEventListener('mouseover', hover);
    document.body.addEventListener('click', click);
    init();
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
    const link = target.closest(videoselector) as HTMLAnchorElement;
    if (link === null)
        return;
    const img = link.querySelector('img') as HTMLImageElement;
    // always prevent going to video
    e.preventDefault();
    const name = link.getAttribute('href').substr(8);
    // extract and store information on video
    addToStore(name, img.nextElementSibling?.lastChild.textContent, img.src, link.lastElementChild?.children[1]?.textContent, link.lastElementChild?.lastElementChild?.firstElementChild?.textContent);
    if (later !== null) {
        // queue button clicked
        enqueue(name);
    } else {
        // video clicked
        enqueueNow(name);
        gotoNextInQueue();
    }
}
