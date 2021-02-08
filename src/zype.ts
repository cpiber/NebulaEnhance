import SpeedClick from "./_speedclick";
import SpeedDial from "./_speeddial";

const sendEvent = <T> (name: string, data?: any) => {
    return new Promise<T> ((resolve, reject) => {
        const e = `enhancer-event-${Math.random().toString().substr(2, 8)}`;
        const c = (ev: CustomEvent) => {
            console.log(ev.detail);
            document.removeEventListener(e, c);
            if (ev.detail.err)
                reject(ev.detail.err)
            else
                resolve(ev.detail.res);
        };
        document.addEventListener(e, c);
        document.dispatchEvent(new CustomEvent(`enhancer-${name}`, { detail: { name: e, ...data } }));
    });
}
const getFromStorage = <T>(key: string | string[] | { [key: string]: any }) => sendEvent<T>('storageGet', { get: key });

const init = async () => {
    const {
        playbackRate,
        playbackChange,
        targetQualities,
    } = await getFromStorage<{ playbackRate: number, playbackChange: number, targetQualities: number[] }>({
        playbackRate: 1,
        playbackChange: 0.1,
        targetQualities: []
    });
    console.log(playbackRate, playbackChange, targetQualities);

    window.theoplayer.playbackRate = playbackRate;
    window.theoplayer.addEventListener('playing', () => window.theoplayer.videoTracks[0].targetQuality = targetQualities.map(h => window.theoplayer.videoTracks[0].qualities.find(q => q.height == h)).filter(q => q !== undefined));
    
    const android = await sendEvent<boolean>('isAndroid');
    console.log(android);
    if (!android) {
        window.THEOplayer.videojs.registerComponent("SpeedDial", SpeedDial(playbackRate, playbackChange));
        window.theoplayer.ui.getChild("controlBar").addChild("SpeedDial", {});
    } else {
        window.THEOplayer.videojs.registerComponent("SpeedClick", SpeedClick());
        window.theoplayer.ui.getChild("controlBar").addChild("SpeedClick", {});
    }
};

(() => {
    if (document.body.classList.contains('enhancer-zype'))
        return;
    document.body.classList.add('enhancer-zype');

    const waitForTheo = () => {
        console.log('waiting');
        if (!window.theoplayer)
            return;
        clearInterval(int);
        init();
    }
    const int = setInterval(waitForTheo, 100);
})();