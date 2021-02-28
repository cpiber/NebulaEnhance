import { videosettings } from "../../_shared";
import { c, getBrowserInstance, injectScript } from "../../_sharedBrowser";
import iconWatchLater from "./../../../icons/watchlater.svg";
import { addToStore, enqueue, enqueueNow, gotoNextInQueue, init as initQueue, isEmptyQueue, setQueue } from "./_queue";
import { init as initDrag } from "./_queueDrag";

const videoselector = 'a[href^="/videos/"]';
const addToQueue = getBrowserInstance().i18n.getMessage('pageAddToQueue');

export const nebula = async () => {
    window.addEventListener('message', message);
    maybeLoadComments();
    document.body.addEventListener('mouseover', hover);
    document.body.addEventListener('click', click);
    const e = initQueue();
    initDrag(e);
    window.addEventListener('hashchange', hashChange);
    hashChange();
    
    const isAndroid: boolean = await getBrowserInstance().runtime.sendMessage("isAndroid");
    const youtube: boolean = (await getBrowserInstance().storage.local.get({ youtube: false })).youtube;
    if (isAndroid || youtube) {
        const cb = mutation(() => {
            // substitute hover listener
            if (isAndroid)
                Array.from(document.querySelectorAll(`${videoselector} img`)).forEach(createLink);
            if (youtube)
                maybeLoadComments();
        });
        const m = new MutationObserver(cb);
        m.observe(document.querySelector('#root'), { subtree: true, childList: true });
        cb();
    }

    // inject custom script (if available)
    const s = (await getBrowserInstance().storage.local.get({ customScriptPage: '' })).customScriptPage;
    if (s)
        injectScript(document.body, s);
};

// @ts-ignore
const replyMessage = (e: MessageEvent, data: any, err?: any) => e.data.name && e.source.postMessage(c({ type: e.data.name, res: data, err: err }), e.origin);
const setSetting = (e: MessageEvent) => videosettings[e.data.setting as keyof typeof videosettings] = e.data.value;
const getSetting = (e: MessageEvent) => replyMessage(e, e.data.setting ? videosettings[e.data.setting as keyof typeof videosettings] : videosettings);
const message = (e: MessageEvent) => {
    if (e.origin !== "https://player.zype.com" && e.origin !== "http://player.zype.com")
        return;
    const msg = (typeof e.data === "string" ? { type: e.data } : e.data) as { type: string, [key: string]: any };
    switch (msg.type) {
        case "getSetting":
            return getSetting(e);
        case "setSetting":
            return setSetting(e);
    }
}

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
    createLink(e.target as HTMLElement);
};
const createLink = (img: HTMLElement) => {
    if (img.parentElement.querySelector('.enhancer-queueButton') !== null)
        return; // queue button exists
    // create queue button
    const later = document.createElement('div');
    const time = img.nextElementSibling;
    later.innerHTML = `<span class="${time?.querySelector('span')?.className}">${addToQueue}</span>${iconWatchLater}`;
    later.className = `${time?.className} enhancer-queueButton`;
    img.parentElement.appendChild(later);
};
const mutation = (func: () => void) => {
    let timeout = 0;
    return function () {
        clearTimeout(timeout);
        timeout = window.setTimeout(func, 500);
    }
};

const click = async (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const later = target.closest('.enhancer-queueButton');
    const link = target.closest<HTMLAnchorElement>(videoselector);
    if (link === null)
        return;
    const img = link.querySelector('img');
    const name = link.getAttribute('href').substr(8);
    // extract and store information on video
    await addToStore(name,
        img.nextElementSibling?.lastChild.textContent,
        img.src,
        link.lastElementChild?.children[1]?.textContent,
        link.lastElementChild?.lastElementChild?.firstElementChild?.textContent);
    // no queue and video clicked
    if (isEmptyQueue() && later === null)
        return;
    // always prevent going to video
    e.preventDefault();
    if (later !== null) {
        // queue button clicked
        enqueue(name);
    } else {
        // video clicked
        enqueueNow(name);
        gotoNextInQueue();
    }
};

const hashChange = () => {
    const current = window.location.pathname.match(/^\/videos\/(.+)\/?$/);
    const hash = window.location.hash.match(/^#([A-Za-z0-9\-_]+(?:,[A-Za-z0-9\-_]+)*)$/);
    if (!hash)
        return; // invalid video list
    // extract comma separated list of friendly-names from hash
    const q = hash[1].split(',');
    setQueue(q, current ? current[1] : undefined);
};

const maybeLoadComments = () => {
    if (window.location.pathname.match(/^\/videos\//))
        loadComments();
};
const loadComments = async () => {
    const h2 = Array.from(document.querySelectorAll('h2'));
    if (h2.length < 2) return;
    const title = h2[0].textContent;
    const creator = h2[1].textContent;
    if (!title || !creator) return;
    if (!h2[0].nextElementSibling || h2[0].nextElementSibling.querySelector('.enhancer-yt'))
        return; // already requested
    console.debug(`Requesting '${title}' by ${creator}`);

    try {
        const vid = await getBrowserInstance().runtime.sendMessage({ type: 'getYoutubeId', creator, title });
        const v = document.createElement('span');
        v.classList.add('enhancer-yt');
        const a = document.createElement('a');
        a.href = `https://youtu.be/${vid}`;
        a.target = '_blank';
        a.textContent = a.href;
        v.append(a);
        h2[0].nextElementSibling.append(h2[0].nextElementSibling.querySelector('span[class]')?.cloneNode(true), v);
    } catch (err) {
        console.error(err);
    }
};
