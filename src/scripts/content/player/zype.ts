import { isMobile, videosettings } from "../../helpers/shared";
import { sendEvent, sendMessage } from "../../helpers/sharedPage";
import SpeedClick from "./speedclick";
import SpeedDial from "./speeddial";
import TheatreButton from "./TheatreButton";

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

const playerSettings = async () => {
  const {
    playbackRate: defaultPlaybackRate,
    playbackChange,
    volume: defaultVolume,
    autoplay,
    targetQualities: defaultQuality,
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
  const subtitles = (currentSubtitles !== null ? currentSubtitles : defaultSubtitles).trim();
  const quality = currentQuality ? currentQuality : defaultQuality;
  console.debug(playbackRate, playbackChange, volume, quality,
    "\tcurrent:", currentPlaybackRate, currentVolume, currentQuality, currentSubtitles,
    "\tdefault:", defaultPlaybackRate, defaultVolume, defaultQuality, defaultSubtitles);
  return { autoplay, playbackRate, playbackChange, volume, subtitles, quality };
}

export const init = async () => {
  const t = window.theoplayer, T = window.THEOplayer;
  const { autoplay, playbackRate, playbackChange, volume, subtitles, quality } = await playerSettings();

  // set autoplay (auto-updates)
  t.autoplay = autoplay;
  // set playbackRate (auto-updates)
  t.playbackRate = playbackRate;
  // set volume (auto-updates)
  t.volume = volume;
  // set qualities and subtitles when starting player
  const set = () => {
    t.removeEventListener('playing', set); // only once
    try {
      // if already set quality on page, use that
      // else if only one target quality, extract that
      // default to target quality array
      const qualities = typeof quality === "number"
        ? [t.videoTracks[0].qualities.find(q => q.height === quality)]
        : quality.map(h => t.videoTracks[0].qualities.find(q => q.height === h)).filter(q => q !== undefined);
      t.videoTracks[0].targetQuality = qualities?.length === 1 ? qualities[0] : qualities;
    } catch (err) {
      console.error(err);
    }
    
    try {
      const track = subtitles !== "" ? t.textTracks.find(e => e.label === subtitles) : null;
      if (track) track.mode = 'showing';
    } catch (err) {
      console.error(err);
    }
    t.element.focus();
    // listen for changes and save
    const updateQ = () => setSetting('quality', t.videoTracks[0].activeQuality.height);
    t.videoTracks[0].addEventListener('activequalitychanged', updateQ);
    t.videoTracks[0].addEventListener('targetqualitychanged', updateQ);
    t.textTracks.addEventListener('change', () => setSetting('subtitles', t.textTracks.find(e => e.mode === 'showing')?.label || ""));
  };
  t.addEventListener('playing', set);

  // listen to changes and save
  t.addEventListener('ratechange', () => setSetting('playbackRate', t.playbackRate));
  t.addEventListener('volumechange', () => setSetting('volume', t.volume));

  // add button that toggles theatre mode
  T.videojs.registerComponent("TheatreButton", TheatreButton());
  t.ui.getChild("controlBar").addChild("TheatreButton", {});
  
  const mobile = isMobile();
  console.debug(mobile, mobile ? 'Android' : 'Other');
  const name = !mobile ? "SpeedDial" : "SpeedClick";
  const comp = !mobile ? SpeedDial(playbackRate, playbackChange) : SpeedClick();
  T.videojs.registerComponent(name, comp);
  t.ui.getChild("controlBar").addChild(name, {});

  // custom keyboard shortcuts
  document.addEventListener('keydown', getPressedKey.bind(null, playbackChange));
  // give focus to player when no controls are open (allows for better keyboard navigation)
  t.element.parentElement.addEventListener('click', () =>
    t.element.parentElement.querySelectorAll('.vjs-control-bar [aria-expanded="true"]').length === 0 && t.element.focus());
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
  if (!isTheoPlayerFocused())
    return;
  const pressedKey = e.key;
  const t = window.theoplayer;
  switch (pressedKey) {
    case 'Escape':
      window.theoplayer.element.focus(); // give focus back
      break;
    case ',':
      t.currentTime -= 0.03; // "frame" back
      break;
    case '.':
      t.currentTime += 0.03; // "frame" forward
      break;
    case 'j':
      t.currentTime -= 10;
      break;
    case 'l':
      t.currentTime += 10;
      break;
    case 'k':
      if (t.paused)
        t.play();
      else
        t.pause();
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
    default:
      return;
  }
  e.stopPropagation();
  e.preventDefault();
};
