import { videosettings, ytvideo } from "../../_shared";
import { c, getBrowserInstance, injectScript } from "../../_sharedBrowser";
import iconWatchLater from "./../../../icons/watchlater.svg";
import { addToStore, enqueue, enqueueNow, gotoNextInQueue, init as initQueue, isEmptyQueue, setQueue, videoUrlMatch } from "./_queue";
import { init as initDrag } from "./_queueDrag";

const videoselector = 'a[href^="/videos/"]';
const addToQueue = getBrowserInstance().i18n.getMessage('pageAddToQueue');

function getFromStorage<T extends { [key: string]: any }>(key: T): Promise<T>;
function getFromStorage<T>(key: string | string[] | { [key: string]: any }) { return getBrowserInstance().storage.local.get(key); }

export const nebula = async () => {
    const menu = document.querySelector('menu');
    window.addEventListener('message', message.bind(null, menu));
    maybeLoadComments();
    document.body.addEventListener('mouseover', hover);
    document.body.addEventListener('click', click);
    const e = initQueue();
    initDrag(e);
    window.addEventListener('hashchange', hashChange);
    hashChange();

    const isAndroid: boolean = await getBrowserInstance().runtime.sendMessage("isAndroid");
    const { youtube, theatre, customScriptPage } = await getFromStorage({ youtube: false, theatre: false, customScriptPage: '' });
    console.debug(youtube, theatre);
    if (isAndroid || youtube || theatre) {
        const r = refreshTheatreMode.bind(null, menu);
        const cb = mutation(() => {
            // substitute hover listener
            if (isAndroid)
                Array.from(document.querySelectorAll(`${videoselector} img`)).forEach(createLink);
            if (youtube)
                maybeLoadComments();
            cancelTheatreMode();
            if (theatre && !isAndroid)
                maybeGoTheatreMode(menu);
            const f = document.querySelector('iframe');
            if (!f)
                return;
            f.removeEventListener('fullscreenchange', r);
            f.addEventListener('fullscreenchange', r);
        });
        const m = new MutationObserver(cb);
        m.observe(document.querySelector('#root'), { subtree: true, childList: true });
        window.addEventListener('resize', () => updateTheatreMode(menu));
        cb();
    }

    // inject custom script (if available)
    if (customScriptPage)
        injectScript(document.body, customScriptPage);
};

// @ts-ignore
const replyMessage = (e: MessageEvent, name: string, data: any, err?: any) => name && e.source.postMessage(c({ type: name, res: data, err: err }), e.origin);
const setSetting = (setting: string, value: number | string) => videosettings[setting as keyof typeof videosettings] = value as never;
const getSetting = (e: MessageEvent, name: string, setting: string) => replyMessage(e, name, setting ? videosettings[setting as keyof typeof videosettings] : videosettings);
let theatreMode = false;
const message = (menu: HTMLElement, e: MessageEvent) => {
    if (e.origin !== "https://player.zype.com" && e.origin !== "http://player.zype.com")
        return;
    let d = e.data;
    try {
        d = JSON.parse(d);
    } catch (err) {
    }
    const msg = (typeof d === "string" ? { type: d } : d) as { type: string, [key: string]: any };
    switch (msg.type) {
        case "getSetting":
            return getSetting(e, msg.name, msg.setting);
        case "setSetting":
            const v = isNaN(msg.value) || msg.value == "" ? msg.value as string : +msg.value;
            return setSetting(msg.setting, v);
        case "goTheatreMode":
            return goTheatreMode(menu);
        case "cancelTheatreMode":
            return cancelTheatreMode();
        case "toggleTheatreMode":
            return theatreMode ? cancelTheatreMode() : goTheatreMode(menu);
    }
}

const queueBottonLocation = (img: HTMLElement) => {
    if (window.location.host === "watchnebula.com") {
        return img.parentElement;
    } else {
        return img.parentElement.parentElement;
    }
}
const queueOtherLocation = (img: HTMLElement) => {
    if (window.location.host === "watchnebula.com") {
        return img.nextElementSibling;
    } else {
        return img.parentElement.nextElementSibling;
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
    if (queueBottonLocation(img).querySelector('.enhancer-queueButton') !== null)
        return; // queue button exists
    // create queue button
    const later = document.createElement('div');
    const time = queueOtherLocation(img);
    if (!time || !time.querySelector('span'))
        return; // ignore profile pic
    later.innerHTML = `<span class="${time.querySelector('span').className}">${addToQueue}</span>${iconWatchLater}`;
    later.className = `${time?.className} enhancer-queueButton`;
    queueBottonLocation(img).appendChild(later);
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
        queueOtherLocation(img)?.lastChild.textContent,
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
    const current = window.location.pathname.match(videoUrlMatch);
    const hash = window.location.hash.match(/^#([A-Za-z0-9\-_]+(?:,[A-Za-z0-9\-_]+)*)$/);
    if (!hash)
        return; // invalid video list
    // extract comma separated list of friendly-names from hash
    const q = hash[1].split(',');
    setQueue(q, current ? current[1] : undefined);
};

const maybeLoadComments = () => {
    if (window.location.pathname.match(/^\/videos\/.+/))
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
        const vid: ytvideo = await getBrowserInstance().runtime.sendMessage({ type: 'getYoutubeId', creator, title });
        const v = document.createElement('span');
        v.classList.add('enhancer-yt');
        const a = document.createElement('a');
        a.href = `https://youtu.be/${vid.video}`;
        a.target = '_blank';
        a.textContent = a.href;
        v.append(a, ` (${(vid.confidence * 100).toFixed(1)}%)`);
        h2[0].nextElementSibling.append(h2[0].nextElementSibling.querySelector('span[class]')?.cloneNode(true), v); // dot
    } catch (err) {
        console.error(err);
    }
};

const maybeGoTheatreMode = (menu: HTMLElement) => {
    if (window.location.pathname.match(/^\/videos\/.+/))
        setTimeout(() => goTheatreMode(menu), 0);
};
const goTheatreMode = (menu: HTMLElement) => {
    const mh = menu.getBoundingClientRect().height;
    const frame = document.querySelector('iframe');
    const ratio = frame.clientWidth / frame.clientHeight;
    const top = +window.getComputedStyle(frame.parentElement.parentElement).paddingTop.slice(0, -2);
    if (!ratio)
        return;
    let newheight = window.innerHeight - 2 * mh - 2 * top;
    let newwidth = ratio * newheight;
    if (newwidth > window.innerWidth - top * 2) {
        const ratio2 = frame.clientHeight / frame.clientWidth;
        newwidth = window.innerWidth - top * 2;
        newheight = ratio2 * newwidth;
    }
    if (!newheight || !newwidth)
        return;
    frame.parentElement.style.height = `${newheight}px`;
    frame.parentElement.style.width = `${newwidth}px`;
    theatreMode = true;
};
const cancelTheatreMode = () => {
    const frame = document.querySelector('iframe');
    if (!frame)
        return;
    frame.parentElement.style.height = '';
    frame.parentElement.style.width = '';
    theatreMode = false;
};
const updateTheatreMode = (menu: HTMLElement) => {
    if (theatreMode)
        maybeGoTheatreMode(menu);
};
const refreshTheatreMode = (menu: HTMLElement) => {
    if (!theatreMode)
        return;
    cancelTheatreMode();
    setTimeout(goTheatreMode, 0, menu);
}
