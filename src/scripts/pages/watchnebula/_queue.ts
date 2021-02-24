import play from "../../../icons/play.svg";
import { getBrowserInstance } from "../../_sharedBrowser";

const nothingToPlay = getBrowserInstance().i18n.getMessage('pageNothingToPlay');
Array.prototype.equals = function <T>(this: Array<T>, other: Array<T>) { return this.every((v, i) => v === other[i]); }

export type video = {
    length: string,
    thumbnail: string,
    title: string,
    creator: string,
};
type Queue = Array<string> & { splice2: (start: number, count: number, elements?: string[], nodes?: HTMLElement[]) => [string[], HTMLElement[]] };

const store: { [key: string]: video } = {};
const queue: Queue = [] as Queue;
let queuepos = -1;
let popupel: HTMLElement = null;
let queueel: HTMLElement = null;
let titleel: HTMLElement = null;
let quenoel: HTMLElement = null;

export function addToStore(name: string, length: string, thumbnail: string, title: string, creator: string): Promise<video>;
export function addToStore(name: string): Promise<video>;
export function addToStore(name: string, ...args: any[]) {
    if (store[name])
        return Promise.resolve(store[name]); // already in
    return (args.length === 4 ? Promise.resolve(args as string[]) : requestData(name))
        .then(([length, thumbnail, title, creator]) => store[name] = { length, thumbnail, title, creator });
}
export const isEmptyQueue = () => queue.length === 0;
export const enqueue = (name: string, pos?: number) => {
    if (!store[name])
        throw "Not in store!";
    if (pos !== undefined)
        queue.splice2(pos, 0, [name]);
    else
        queue.splice2(queue.length, 0, [name]);
    popupel.classList.remove('hidden');
    calcBottom(popupel.classList.contains('down'));
    console.log(queue.join(','));
};
export const enqueueNow = (name: string) => {
    if (queue[queuepos] !== name && queue[queuepos + 1] !== name)
        enqueue(name, queuepos + 1);
}
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
        if (history.state?.fake === true)
            window.history.back();
        setTimeout(() => {
            window.history.pushState({ fake: true }, null, url);
            window.dispatchEvent(new PopStateEvent("popstate"));
        }, 0);
    }
    queueel?.children[index]?.classList.add('playing');
    queueel?.children[index]?.scrollIntoView();
    updateText();
}
export const gotoNextInQueue = () => gotoQueue(queuepos + 1);
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
}
export const moveQueue = (orig: number, index: number) => {
    const [name, elem] = queue.splice2(orig, 1);
    queue.splice2(index, 0, name, elem);
    if (queuepos >= 0) {
        if (queuepos === orig) queuepos = index;
        else if (orig > queuepos && index <= queuepos) queuepos++;
        else if (orig < queuepos && index >= queuepos) queuepos--;
        updateText();
    }
    return elem[0];
}
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
        setTimeout(() => gotoQueue(queue.indexOf(current), false), 0);
    else
        clearText(); // new queue, nothing playing
    popupel.classList.toggle('hidden', q.length === 0);
    calcBottom(popupel.classList.contains('down'));
    return q;
}


export const init = () => {
    // remove existing elements from extension reload
    Array.from(document.querySelectorAll('.enhancer-queue')).forEach(n => n.remove());

    const q = document.createElement('div');
    popupel = q;
    q.className = 'enhancer-queue hidden';
    q.innerHTML = `
        <div class="enhancer-queue-inner">
            <div class="top">
                <div class="current"><span class="title">${nothingToPlay}</span><span class="no">-</span> / <span class="of">0</span></div>
                <div class="close">&times;</div>
            </div>
            <div class="elements"></div>
        </div>
        <div class="enhancer-queue-share">
            
        </div>
    `;
    queueel = q.querySelector('.elements');
    const e = queueel;
    const o = q.querySelector('.of');
    titleel = q.querySelector('.title');
    quenoel = q.querySelector('.no');
    document.body.append(q);

    queue.splice2 = (start: number, count: number, elements?: string[], nodes?: HTMLElement[]) => {
        if (nodes !== undefined && nodes.length !== 0 && nodes.length !== elements.length)
            throw new Error('length mismatch');
        start = start < 0 ? queue.length - start : start;
        start = start < 0 ? 0 : start > queue.length ? queue.length : start;
        const end = start + count > queue.length ? queue.length : start + count;
        let s = start > 0 ? e.children[start - 1] : null;
        const n = nodes === undefined || nodes.length === 0;
        const delel = [];
        for (let i = end - 1; i >= start; i--) {
            delel.push(e.children[i] as HTMLElement);
            e.children[i].remove();
        }
        for (let i = 0; i < elements?.length || 0; i++) {
            const node = n ? createQueueElement(elements[i]) : nodes[i];
            s === null ? e.firstChild === null ? e.append(node) : e.firstChild.before(node) : s.after(node);
            s = node;
        }
        const del = Array.prototype.splice.call(queue, start, count, ...(elements || [])) as string[];
        o.textContent = `${queue.length}`;
        return [del, delel];
    };
    e.addEventListener('click', clickElements);
    q.querySelector('.top').addEventListener('click', clickTop);
    window.addEventListener('message', msg);
    return e;
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
    const r = (e.target as HTMLElement).closest('.close');
    if (r === null)
        toggleQueue();
    else
        clearQueue();
};
const next = (() => {
    function _next() {
        gotoNextInQueue();
        this.waitEnd = false;
    }
    return _next.bind(_next) as (() => void) & { waitEnd: boolean };
})();
const msg = (e: MessageEvent) => {
    if (e.origin !== "https://player.zype.com" && e.origin !== "http://player.zype.com")
        return;
    try {
        const m = JSON.parse(e.data);
        switch (m.event) {
            case "zype:complete":
                setTimeout(next, 5000);
                next.waitEnd = true;
                break;
            case "zype:pause":
                if (next.waitEnd) next();
                break;
        }
    } catch { }
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
const requestData = (name: string) => {
    return fetch(
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
    ).then(res => res.json()).then(r => {
        if (!r?.response?.length || r.response.length !== 1)
            throw new Error(`Invalid response: ${JSON.stringify(r)}`);
        return r;
    }).then(data => {
        const vid = data.response[0];
        return [
            `${Math.floor(vid.duration / 60)}:${vid.duration - Math.floor(vid.duration / 60) * 60}`,
            (vid.thumbnails as thumb[])[0].url,
            vid.title,
            (vid.categories as cat[]).find(c => c.value.length).value[0]
        ] as string[];
    });
};
const createQueueElement = (name: string): HTMLElement => {
    const n = document.createElement('div');
    n.className = 'element';
    n.innerHTML = `
        <div class="drag">&#x2630;</div>
        <div class="thumb">
            <img src="${store[name].thumbnail}" draggable="false" />
            <div class="play">${play}</div>
        </div>
        <div class="data">
            <span class="title"></span>
            <span class="creator"></span>
        </div>
        <div class="remove"><span class="r">&#128465;</span></div>
    `;
    n.draggable = true;
    n.querySelector('.title').textContent = store[name].title;
    n.querySelector('.creator').textContent = `${store[name].creator} • ${store[name].length}`;
    return n;
};