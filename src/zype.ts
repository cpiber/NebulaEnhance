import { sendEvent } from "./_sharedPage";
import SpeedClick from "./_speedclick";
import SpeedDial from "./_speeddial";

const getFromStorage = <T>(key: string | string[] | { [key: string]: any }) => sendEvent<T>('storageGet', { get: key });

const init = async () => {
    const t = window.theoplayer, T = window.THEOplayer;
    const {
        playbackRate,
        playbackChange,
        targetQualities,
    } = await getFromStorage<{ playbackRate: number, playbackChange: number, targetQualities: number[] }>({
        playbackRate: 1,
        playbackChange: 0.1,
        targetQualities: []
    });
    console.debug(playbackRate, playbackChange, targetQualities);

    // set playbackRate (auto-updates)
    t.playbackRate = playbackRate;
    // set qualities when starting player
    const setQualities = () => {
        t.videoTracks[0].targetQuality =
            targetQualities.map(h => t.videoTracks[0].qualities.find(q => q.height === h)).filter(q => q !== undefined);
        t.element.focus();
        t.removeEventListener('playing', setQualities); // only once
    };
    t.addEventListener('playing', setQualities);
    
    const android = await sendEvent<boolean>('isAndroid');
    console.debug(android, android ? 'Android' : 'Other');
    if (!android) {
        // add SpeedDial to allow changing speed with mouse wheel
        T.videojs.registerComponent("SpeedDial", SpeedDial(playbackRate, playbackChange));
        t.ui.getChild("controlBar").addChild("SpeedDial", {});
        // custom keyboard shortcuts
        document.addEventListener('keydown', getPressedKey);
        // give focus to player when no controls are open (allows for better keyboard navigation)
        t.element.parentElement.addEventListener('click', () =>
            t.element.parentElement.querySelectorAll('.vjs-control-bar [aria-expanded="true"]').length === 0 && t.element.focus());
    } else {
        // add button that prompts for new speed
        T.videojs.registerComponent("SpeedClick", SpeedClick());
        t.ui.getChild("controlBar").addChild("SpeedClick", {});
    }
};

const isTheoPlayerFocused = function() {
    // check if theoplayer is focused
    // taken from zype.com
    let node = document.activeElement;

    while (node !== null) {
      if (window.theoplayer.element === node)
        return true;
      node = node.parentElement;
    }
    return false;
};
const getPressedKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey)
        return;
    const pressedKey = e.key;
    let action: () => void;
    switch (pressedKey) {
        case 'Escape':
            window.theoplayer.element.focus(); // give focus back
            break;
        case ',':
            // "frame" back
            action = () => window.theoplayer.currentTime -= 0.03;
            break;
        case '.':
            // "frame" forward
            action = () => window.theoplayer.currentTime += 0.03;
            break;
    }
    if (action && isTheoPlayerFocused()) {
        action();
        e.stopPropagation();
        e.preventDefault();
    }
};

(() => {
    if (document.body.classList.contains('enhancer-zype'))
        return;
    document.body.classList.add('enhancer-zype');

    const waitForTheo = () => {
        console.debug('waiting');
        if (!window.theoplayer)
            return;
        clearInterval(int);
        init();
    }
    const int = setInterval(waitForTheo, 100);
})();