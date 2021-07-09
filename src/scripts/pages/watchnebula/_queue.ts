import iconClose from "../../../icons/close.svg";
import iconNext from "../../../icons/next.svg";
import iconReverse from "../../../icons/reverse.svg";
import iconShare from "../../../icons/share.svg";
import { getBrowserInstance, isChrome } from "../../_sharedBrowser";
import { Queue, Store, video } from "./_VideoQueue";
import "../../_shared";

const nothingToPlay = getBrowserInstance().i18n.getMessage('pageNothingToPlay');
const share = getBrowserInstance().i18n.getMessage('pageShareQueue');
const link = getBrowserInstance().i18n.getMessage('pageShareLink');
const starthere = getBrowserInstance().i18n.getMessage('pageShareStartHere');
const confirmClear = getBrowserInstance().i18n.getMessage('pageQueueClearConfirm');
export const videoUrlMatch = /^\/videos\/(.+?)\/?$/;

const store: Store = {};
let queue: Queue = null;
let queuepos = -1;
// some html elements related to queue and share
let popupel: HTMLElement = null;
let queueel: HTMLElement = null;
let titleel: HTMLElement = null;
let quenoel: HTMLElement = null;
let qsharel: HTMLElement = null;
let qshtxel: HTMLInputElement = null;
let qshahel: HTMLInputElement = null;

export function addToStore(name: string, length: string, thumbnail: string, title: string, creator: string): Promise<video>;
export function addToStore(name: string): Promise<video>;
export function addToStore(name: string, ...args: any[]) {
    // promise always resolves to data from store
    if (store[name])
        return Promise.resolve(store[name]); // already in
    // either use data from arguments (all must be given) or request from api based on given name
    console.debug('Added video', args);
    return (args.length === 4 ? Promise.resolve(args as string[]) : requestData(name))
        .then(([length, thumbnail, title, creator]) => store[name] = { length, thumbnail, title, creator });
}
export const isEmptyQueue = () => queue.length === 0;
let enqueueAnim = false;
export const enqueue = (name: string, pos?: number) => {
    if (!store[name])
        throw "Not in store!";
    if (pos !== undefined)
        queue.splice2(pos, 0, [name]);
    else if (queue[queue.length - 1] !== name)
        queue.splice2(queue.length, 0, [name]);
    popupel.classList.remove('hidden');
    calcBottom(popupel.classList.contains('down'));

    // play little animation to show something was added
    if (enqueueAnim)
        return;
    enqueueAnim = !enqueueAnim;
    setTimeout(() => {
        const top = queueel.scrollTop;
        queueel.scrollTop += 10;
        window.setTimeout(() => {
            queueel.scrollTop = top;
            window.setTimeout(() => enqueueAnim = !enqueueAnim, 500);
        }, 200);
    }, 0);
};
export const enqueueNow = (name: string) => {
    if (queue[queuepos] !== name && queue[queuepos + 1] !== name)
        enqueue(name, queuepos + 1);
};
export const removeFromQueue = (index: number) => {
    if (index < 0 || index >= queue.length) return;
    if (queue.length === 1) return clearQueue();
    queue.splice2(index, 1);
    if (queuepos >= 0 && index <= queuepos) {
        --queuepos;
        updateText();
    }
};
export const clearQueue = () => {
    queuepos = -1;
    queue.splice2(0, queue.length);
    clearText();
    popupel.classList.add('hidden');
};
export const gotoQueue = (index: number, go = true) => {
    if (index < 0 || index >= queue.length) return;
    queueel?.children[queuepos]?.classList.remove('playing');
    queuepos = index;
    if (go) {
        const url = `/videos/${queue[index]}`;
        // trick router into accepting my url without reloading page
        // if previously tricked, need to undo that (to avoid broken history)
        // on chrome, this breaks sometimes, but the history is somewhat fine (double back)
        if (!isChrome() && history.state?.fake === true)
            window.history.back();
        setTimeout(() => {
            window.history.pushState({ fake: true }, null, url);
            window.dispatchEvent(new PopStateEvent("popstate"));
        }, 0);
    }
    if (index >= 0) {
        queueel?.children[index]?.classList.add('playing');
        queueel?.children[index]?.scrollIntoView();
        updateText();
    } else {
        clearText();
    }
    // chrome does not do this for us
    const yt = document.querySelector('.enhancer-yt');
    if (yt) {
        yt.previousElementSibling.remove();
        yt.remove();
    }
    document.querySelector('.enhancer-yt-err')?.remove();
};
export const gotoNextInQueue = () => gotoQueue(queuepos + 1);
export const gotoPrevInQueue = () => gotoQueue(queuepos - 1);
export const toggleQueue = () => {
    const tggl = popupel.classList.toggle('down');
    // disable transitions after it's down
    // or enable now
    // to make sure adding new elements while down does not transition
    if (tggl)
        setTimeout(() => popupel.classList.add('no-transition'), 100);
    else
        popupel.classList.remove('no-transition');
    calcBottom(tggl);
};
export const moveQueue = (orig: number, index: number) => {
    const [name, elem] = queue.splice2(orig, 1);
    queue.splice2(index, 0, name, elem);
    if (queuepos >= 0) {
        // adjust index based on new and old positions, difference always 1 (except when moving current)
        if (queuepos === orig) queuepos = index;
        else if (orig > queuepos && index <= queuepos) queuepos++;
        else if (orig < queuepos && index >= queuepos) queuepos--;
        updateText();
    }
    return elem[0];
};
export const setQueue = async (newq: string[], current?: string) => {
    // check if they're already same
    if (newq.length === queue.length && newq.equals(queue))
        return;
    // wait for all to be added (requests from api if needed)
    // filters queue to valid elements
    const q = (await Promise.all(newq.map(v => addToStore(v).catch(console.error))))
        .map((v, i) => v !== undefined ? newq[i] : undefined).filter(e => e !== undefined);
    queue.splice2(0, queue.length, q); // replace current queue
    if (current)
        // use timeout to make sure dom is updated
        setTimeout(() => gotoQueue(queue.indexOf(current), false), 0);
    else
        clearText(); // new queue, nothing playing
    popupel.classList.toggle('hidden', q.length === 0);
    calcBottom(popupel.classList.contains('down'));
    return q;
};
export const reverseQueue = () => {
    queue.reverse2();
    if (queuepos !== -1) {
        queuepos = queue.length - queuepos - 1;
        updateText();
        queueel.querySelector('.playing').scrollIntoView();
    }
};


export const init = () => {
    // remove existing elements from extension reload
    Array.from(document.querySelectorAll('.enhancer-queue')).forEach(n => n.remove());

    const q = document.createElement('div');
    popupel = q;
    q.className = 'enhancer-queue hidden';
    q.innerHTML = `
        <div class="enhancer-queue-inner">
            <div class="top">
                <div class="current">
                    <span class="title">${nothingToPlay}</span>
                    <span class="no">-</span> / <span class="of">0</span>
                    <span class="prev" role="queue-previous">${iconNext}</span><span class="next" role="queue-next">${iconNext}</span>
                    <span class="reverse">${iconReverse}</span>
                </div>
                <span class="share">${iconShare}</span>
                <span class="close" role="queue-close">${iconClose}</span>
            </div>
            <div class="elements"></div>
        </div>
        <div class="enhancer-queue-share-bg hidden">
            <div class="enhancer-queue-share">
                <div class="top">
                    <h2 class="current">${share}</h2>
                    <div class="close" role="share-close">${iconClose}</div>
                </div>
                <div class="body">
                    <span>${link}:</span>
                    <input type="text" readonly />
                    <label>
                        <input type="checkbox" checked /> ${starthere}
                    </label>
                </div>
            </div>
        </div>
    `;
    queueel = q.querySelector('.elements');
    const o = q.querySelector('.of');
    titleel = q.querySelector('.title');
    quenoel = q.querySelector('.no');
    qsharel = q.querySelector('.enhancer-queue-share-bg');
    qshtxel = qsharel.querySelector('input[type="text"]');
    qshahel = qsharel.querySelector('input[type="checkbox"]');
    document.body.append(q);

    queue = new Queue(queueel, function (this: Queue) { o.textContent = `${this.length}`; }, store);

    queueel.addEventListener('click', clickElements);
    q.querySelector('.top').addEventListener('click', clickTop);
    window.addEventListener('message', msg);
    window.addEventListener('popstate', popState);

    qsharel.querySelector('.close').addEventListener('click', () => qsharel.classList.add('hidden'));
    qshtxel.addEventListener('click', ev => (ev.target as HTMLInputElement).select());
    qshahel.addEventListener('change', setShare);
    return queueel;
};
const clickElements = (e: MouseEvent) => {
    const el = (e.target as HTMLElement).closest('.element');
    if (el === null)
        return;
    e.preventDefault();
    const i = Array.from(el.parentElement.children).findIndex(n => n.isSameNode(el));
    if (i === -1)
        return;
    const r = (e.target as HTMLElement).closest('.r');
    if (r === null)
        gotoQueue(i);
    else
        removeFromQueue(i);
};
const clickTop = (e: MouseEvent) => {
    e.preventDefault();
    const c = (e.target as HTMLElement).closest('.close');
    if (c !== null)
        return confirm(confirmClear) ? clearQueue() : null;
    const s = (e.target as HTMLElement).closest('.share');
    if (s !== null)
        return setShare();
    const r = (e.target as HTMLElement).closest('.reverse');
    if (r !== null)
        return reverseQueue();
    const p = (e.target as HTMLElement).closest('.prev');
    if (p !== null)
        return gotoPrevInQueue();
    const n = (e.target as HTMLElement).closest('.next');
    if (n !== null)
        return gotoNextInQueue();
    toggleQueue();
};
const next: (() => void) & { waitEnd: boolean, timeout: number } = Object.assign(() => {
    if (!next.waitEnd)
        return;
    gotoNextInQueue();
    next.waitEnd = false;
    window.clearTimeout(next.timeout);
}, { waitEnd: false, timeout: 0 });
const msg = (e: MessageEvent) => {
    if (e.origin !== "https://player.zype.com" && e.origin !== "http://player.zype.com")
        return;
    try {
        const m = JSON.parse(e.data);
        switch (m.event) {
            case "zype:complete":
                next.timeout = window.setTimeout(next, 5000); // timeout to ensure next is reached even without second event
                next.waitEnd = true;
                break;
            case "zype:pause":
                if (next.waitEnd) next(); // only if complete reached
                break;
        }
    } catch { }
};
const popState = () => {
    const match = window.location.pathname.match(/^\/videos\/(.+?)\/?$/);
    if (match === null) return gotoQueue(-1, false);
    gotoQueue(queue.indexOf(match[1]), false);
};
const updateText = () => {
    titleel.textContent = store[queue[queuepos]]?.title;
    quenoel.textContent = queuepos >= 0 ? `${queuepos + 1}` : '-';
};
const clearText = () => {
    titleel.textContent = nothingToPlay;
    quenoel.textContent = '-';
};
const calcBottom = (down: boolean) => {
    if (down)
        popupel.style.bottom = `-${queueel.getBoundingClientRect().height}px`;
    else
        popupel.style.bottom = '';
};
const setShare = () => {
    const base = qshahel.checked && queuepos >= 0 ? `${window.location.origin}/videos/${queue[queuepos]}` : window.location.origin;
    const hash = queue.join(',');
    qshtxel.value = `${base}/#${hash}`;
    qsharel.classList.remove('hidden');
};


type thumb = {
    aspect_ratio: number,
    height: number,
    width: number,
    url: string,
    name: string,
};
type cat = {
    _id: string,
    category_id: string,
    title: string,
    value: string[],
};
const requestData = (name: string) =>
    // fetch video data from api and extract video object
    fetch(
        `https://api.zype.com/videos?friendly_title=${name}&per_page=1&api_key=JlSv9XTImxelHi-eAHUVDy_NUM3uAtEogEpEdFoWHEOl9SKf5gl9pCHB1AYbY3QF`,
        {
            "credentials": "omit",
            "headers": {
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.5",
                "Cache-Control": "max-age=0"
            },
            "referrer": `https://watchnebula.com/videos/${name}`,
            "method": "GET",
            "mode": "cors"
        }
    ).then(res => res.json())
        .then(data => {
            if (!data?.response?.length || data.response.length !== 1)
                throw new Error(`Invalid response: ${JSON.stringify(data)}`);
            const vid = data.response[0];
            return [
                `${Math.floor(vid.duration / 60)}:${(vid.duration - Math.floor(vid.duration / 60) * 60).pad(2)}`,
                (vid.thumbnails as thumb[])[0].url,
                vid.title,
                (vid.categories as cat[]).find(c => c.value.length).value[0]
            ] as string[];
        });