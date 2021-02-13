import play from "../../../icons/play.svg";

export type video = {
    length: string,
    thumbnail: string,
    title: string,
    creator: string,
};

const store: { [key: string]: video } = {};
const queue: string[] = [];
let queuepos = 0;
let queueel: HTMLElement = null;

export async function addToStore(name: string, length: string, thumbnail: string, title: string, creator: string): Promise<void>;
export async function addToStore(name: string): Promise<void>;
export async function addToStore(name: string, ...args: any[]) {
    if (store[name])
        return; // already in
    const [ length, thumbnail, title, creator ] = args.length === 4 ? args : await requestData(name);
    store[name] = { length, thumbnail, title, creator };
}
export const enqueue = (name: string, pos?: number) => {
    if (!store[name])
        throw "Not in store!";
    if (pos !== undefined)
        queue.splice(pos, 0, name);
    else
        queue.splice(queue.length, 0, name);
    console.log(queue);
};
export const enqueueNow = (name: string) => {
    if (!name)
        throw "Not in store!";
    queue.splice(queuepos + 1, 0, name);
    console.log(queue);
}
export const removeFromQueue = (index: number) => {
    queue.splice(index, 1);
    console.log(queue);
}
export const gotoQueue = (index: number) => {
    queueel?.children[queuepos]?.classList.remove('playing');
    queuepos = index;
    const url = `/videos/${queue[index]}`;
    // trick router into accepting my url without reloading page
    window.history.pushState(null, null, url);
    window.history.pushState(null, null, url);
    window.history.back();
    queueel?.children[index]?.classList.add('playing');
    console.log(queuepos);
}
export const gotoNextInQueue = () => gotoQueue(queuepos + 1);


export const init = () => {
    // remove existing elements from extension reload
    Array.from(document.querySelectorAll('.enhancer-queue')).forEach(e => e.remove());

    const q = document.createElement('div');
    q.className = 'enhancer-queue';
    q.innerHTML = `
        <div class="top"></div>
        <div class="elements"></div>
    `;
    const e = q.querySelector('.elements') as HTMLElement;
    queueel = e;
    document.body.appendChild(q);

    queue.splice = (start: number, count: number, ...elements: string[]) => {
        start = start < 0 ? queue.length - start : start;
        start = start < 0 ? 0 : start > queue.length ? queue.length : start;
        const end = start + count > queue.length ? queue.length : start + count;
        let s = start > 0 ? e.children[start-1] : null;
        for (let i = start; i < end; i++)
            e.children[i].remove();
        for (let el of elements) {
            const node = insertChild(el);
            s = s === null ? e.appendChild(node) : (s.after(node), node);
        }
        return Array.prototype.splice.call(queue, start, count, ...elements);
    };
    e.addEventListener('click', clickElements);
    window.addEventListener('message', msg);
};
const clickElements = (e: MouseEvent) => {
    const el = (e.target as HTMLElement).closest('.element');
    if (el === null)
        return;
    e.preventDefault();
    const i = Array.from(el.parentElement.children).findIndex(e => e.isSameNode(el));
    gotoQueue(i);
};
const msg = (e: MessageEvent) => {
    if (e.origin !== "https://player.zype.com" && e.origin !== "http://player.zype.com")
        return;
    const m = JSON.parse(e.data);
    if (m.event === "zype:complete") gotoNextInQueue();
}


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
const requestData = async (name: string) => {
    const data = await fetch(`https://api.zype.com/videos?friendly_title=${name}&per_page=1&api_key=JlSv9XTImxelHi-eAHUVDy_NUM3uAtEogEpEdFoWHEOl9SKf5gl9pCHB1AYbY3QF`, {
        "credentials": "omit",
        "headers": {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.5",
            "Cache-Control": "max-age=0"
        },
        "referrer": `https://watchnebula.com/videos/${name}`,
        "method": "GET",
        "mode": "cors"
    }).then(res => res.json()).catch(console.error);
    const vid = data.response[0];
    return [
        `${Math.floor(vid.duration / 60)}:${vid.duration - Math.floor(vid.duration / 60) * 60}`,
        (vid.thumbnails as thumb[])[0].url,
        vid.title,
        (vid.categories as cat[]).find(c => c.value.length).value[0]
    ] as string[];
};
const insertChild = (name: string): HTMLElement => {
    const n = document.createElement('div');
    n.className = 'element';
    n.innerHTML = `
        <div class="thumb">
            <img src="${store[name].thumbnail}" />
            <div class="play">${play}</div>
        </div>
        <div class="data">
            <span class="title">${store[name].title}</span>
            <span class="creator">${store[name].creator} • ${store[name].length}</span>
        </div>
    `;
    return n;
};