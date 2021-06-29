import { videosettings } from "../../_shared";
import { sendEvent, sendMessage } from "./_sharedPage";
import SpeedClick from "./_speedclick";
import SpeedDial from "./_speeddial";
import TheatreButton from "./_TheatreButton";

function getFromStorage<T extends { [key: string]: any }>(key: T): Promise<T>;
function getFromStorage<T>(key: string | string[]): Promise<T>;
function getFromStorage<T>(key: string | string[] | { [key: string]: any }) { return sendEvent<T>('storageGet', { get: key }); }
function setSetting(key: keyof typeof videosettings, value: number | string) { sendMessage('setSetting', { setting: key, value }, false); }
function getSetting(): Promise<typeof videosettings>;
function getSetting(key: keyof typeof videosettings): Promise<typeof videosettings[typeof key]>;
function getSetting(key?: keyof typeof videosettings) { return sendMessage('getSetting', { setting: key }); }

const defaults = {
    playbackRate: 1,
    playbackChange: 0.1,
    volume: 1,
    autoplay: false,
    targetQualities: [] as number[],
    subtitles: ""
};
const init = async () => {
    const t = window.theoplayer, T = window.THEOplayer;
    const {
        playbackRate: defaultPlaybackRate,
        playbackChange,
        volume: defaultVolume,
        autoplay,
        targetQualities,
        subtitles: defaultSubtitles
    } = await getFromStorage(defaults);
    const {
        playbackRate: currentPlaybackRate,
        volume: currentVolume,
        quality: currentQuality,
        subtitles: currentSubtitles
    } = await getSetting();
    const playbackRate = currentPlaybackRate || defaultPlaybackRate || 1;
    const volume = currentVolume || defaultVolume || 1;
    const subtitles = currentSubtitles !== null ? currentSubtitles : defaultSubtitles;
    console.debug(playbackRate, playbackChange, volume, targetQualities,
        '\tcurrent:', currentPlaybackRate, currentVolume, currentQuality, currentSubtitles,
        '\tdefault:', defaultPlaybackRate, defaultVolume, defaultSubtitles);

    // set autoplay (auto-updates)
    t.autoplay = autoplay;
    // set playbackRate (auto-updates)
    t.playbackRate = playbackRate;
    // set volume (auto-updates)
    t.volume = volume;
    // set qualities when starting player
    const setQualities = () => {
        try {
            // if already set quality on page, use that
            // else if only one target quality, extract that
            // default to target quality array
            const quality = currentQuality ? currentQuality : targetQualities.length === 1 ? targetQualities[0] : targetQualities;
            const qualities = typeof quality === "number"
                ? t.videoTracks[0].qualities.find(q => q.height === quality) || null
                : quality.map(h => t.videoTracks[0].qualities.find(q => q.height === h)).filter(q => q !== undefined);
            t.videoTracks[0].targetQuality = qualities;
            t.element.focus();
        } catch (err) {
            console.error(err);
        }
        // listen for changes and save
        t.videoTracks[0].addEventListener('activequalitychanged', () => setSetting('quality', t.videoTracks[0].activeQuality.height));
        t.videoTracks[0].addEventListener('targetqualitychanged', () => setSetting('quality', t.videoTracks[0].activeQuality.height));
        t.removeEventListener('playing', setQualities); // only once
    };
    const setSubtitles = () => {
        if (subtitles !== "") {
            try {
                const track = t.textTracks.find(e => e.label === subtitles);
                if (track) track.mode = 'showing';
                t.element.focus();
            } catch (err) {
                console.error(err);
            }
        }
        // listen for changes and save
        t.textTracks.addEventListener('change', () => setSetting('subtitles', t.textTracks.find(e => e.mode === 'showing')?.label || ""));
        t.removeEventListener('playing', setSubtitles); // only once
    };
    t.addEventListener('playing', setQualities);
    t.addEventListener('playing', setSubtitles);

    // listen to changes and save
    t.addEventListener('ratechange', () => setSetting('playbackRate', t.playbackRate));
    t.addEventListener('volumechange', () => setSetting('volume', t.volume));
    
    const android = await sendEvent<boolean>('isAndroid');
    console.debug(android, android ? 'Android' : 'Other');
    if (!android) {
        // add button that toggles theatre mode
        T.videojs.registerComponent("TheatreButton", TheatreButton());
        t.ui.getChild("controlBar").addChild("TheatreButton", {});
        
        // add SpeedDial to allow changing speed with mouse wheel
        T.videojs.registerComponent("SpeedDial", SpeedDial(playbackRate, playbackChange));
        t.ui.getChild("controlBar").addChild("SpeedDial", {});
        // custom keyboard shortcuts
        document.addEventListener('keydown', getPressedKey.bind(null, playbackChange));
        // give focus to player when no controls are open (allows for better keyboard navigation)
        t.element.parentElement.addEventListener('click', () =>
            t.element.parentElement.querySelectorAll('.vjs-control-bar [aria-expanded="true"]').length === 0 && t.element.focus());
    } else {
        // add button that prompts for new speed
        T.videojs.registerComponent("SpeedClick", SpeedClick());
        t.ui.getChild("controlBar").addChild("SpeedClick", {});
    }
};

const isTheoPlayerFocused = () => {
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
const getPressedKey = (playbackChange: number, e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey)
        return;
    const pressedKey = e.key;
    const t = window.theoplayer;
    let action: () => void = null;
    switch (pressedKey) {
        case 'Escape':
            window.theoplayer.element.focus(); // give focus back
            break;
        case ',':
            action = () => t.currentTime -= 0.03; // "frame" back
            break;
        case '.':
            action = () => t.currentTime += 0.03; // "frame" forward
            break;
        case 'j':
            action = () => t.currentTime -= 10;
            break;
        case 'l':
            action = () => t.currentTime += 10;
            break;
        case 'k':
            action = t.paused ? t.play : t.pause;
            break;
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
            t.currentTime = t.duration * (+pressedKey) / 10;
            break;
        case 'Home':
            t.currentTime = 0;
            break;
        case 'End':
            t.currentTime = t.duration;
            break;
        case '<':
            t.playbackRate = Math.round((t.playbackRate - playbackChange) * 100) / 100;
            break;
        case '>':
            t.playbackRate = Math.round((t.playbackRate + playbackChange) * 100) / 100;
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
        console.debug('ready');
        clearInterval(int);
        init();
    };
    const int = setInterval(waitForTheo, 100);
})();