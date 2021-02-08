
const sendEvent = <T> (name: string, key: any) => {
    return new Promise<T> ((resolve, reject) => {
        const e = `enhancer-event-${Math.random().toString().substr(2, 8)}`;
        const c = (ev: CustomEvent) => {
            document.removeEventListener(e, c);
            if (ev.detail.err)
                reject(ev.detail.err)
            else
                resolve(ev.detail.res);
        };
        document.addEventListener(e, c);
        document.dispatchEvent(new CustomEvent(`enhancer-${name}`, { detail: { name: e, get: key } }));
    });
}
const getFromStorage = <T>(key: string | string[] | { [key: string]: any }) => sendEvent<T>('storageGet', key);

const init = async () => {
    const rate = await getFromStorage<number>('playbackRate') || 1;
    console.log(rate);
    window.theoplayer.playbackRate = rate;
};

const waitForTheo = () => {
    if (!window.theoplayer)
        return;
    clearInterval(int);
    init();
}
const int = setInterval(waitForTheo, 100);