import createSpeedDial from './components/speeddial';
import { init as initDispatch, loadPrefix } from './dispatcher';
import { arrFromLengthy, getFromStorage, Message, onStorageChange, sendMessage } from './sharedpage';

export type Player = HTMLVideoElement & { _enhancerInit: boolean; };

const optionsDefaults = {
  playbackChange: 0.1,
  autoplay: false,
  autoplayQueue: false,
  volumeEnabled: false,
  volumeShow: false,
  volumeChange: 0.1,
  volumeLog: false,
  useFirstSubtitle: false,
};
let options = { ...optionsDefaults };

export const init = async () => {
  const {
    playbackChange, autoplay, autoplayQueue, volumeEnabled,
    volumeChange, volumeLog, volumeShow, useFirstSubtitle,
  } = options = await getFromStorage(optionsDefaults);
  console.debug('playbackChange:', playbackChange, 'autoplay?', autoplay, 'autoplay in queue?', autoplayQueue,
    '\nvolume scroll?', volumeEnabled, 'change:', volumeChange, 'log?', volumeLog, 'show?', volumeShow,
    '\nuse first subtitle?', useFirstSubtitle);

  document.addEventListener('keydown', keydownHandler, { capture: true });
  document.addEventListener('wheel', wheelHandler, { passive: false });
  // document.addEventListener('click', clickHandler, { capture: true }); TODO figure out why preventDefault doesn't prevent the context menu
  document.addEventListener(`${loadPrefix}-video`, initPlayer);
  await initDispatch();

  onStorageChange(changed => {
    console.dev.log('Options changed');
    Object.keys(options).forEach(prop => {
      if (prop in changed && 'newValue' in changed[prop]) {
        /* @ts-expect-error for some reason, options[prop] narrows to never... */
        options[prop] = changed[prop].newValue as typeof options[typeof prop];
      }
    });
    const player = findAPlayer();
    if (!player) return;
    player.autoplay = options.autoplay;
    // (player.controlBar.getChild('VolumeText') as InstanceType<Comp<typeof VolumeText>>).setShown(options.volumeShow); TODO
  });
};

export const initPlayer = async () => {
  const player = await getAPlayer();

  if (!player || player._enhancerInit)
    return; // already initialized this player

  player.addEventListener('ended', () => sendMessage(Message.QUEUE_NEXT, null, false));

  const { autoplay, autoplayQueue } = options;
  console.debug('autoplay?', autoplay, 'autoplayQueue?', autoplayQueue);
  await addPlayerControls(player);

  const { canNext, canPrev, length: queueLen } = await sendMessage(Message.GET_QSTATUS);
  console.debug('canGoNext?', canNext, 'canGoPrev?', canPrev, 'queueLen:', queueLen);
  updatePlayerControls(player, canNext, canPrev);
  player.autoplay = autoplay || (autoplayQueue && !!queueLen);
  try {
    if (player.autoplay) await player.play();
    else player.pause();
  } catch { }

  player._enhancerInit = true;
};

export const findAPlayer = () => document.querySelector<Player>('video#video');

export const getAPlayer = (maxiter: number | null = 10) => new Promise<Player>((resolve, reject) => {
  let iter = 0;
  const i = window.setInterval(() => {
    if (maxiter !== null && iter++ > maxiter) {
      window.clearInterval(i);
      reject('No player found');
      return;
    }
    const player = findAPlayer();
    if (player) {
      window.clearInterval(i);
      resolve(player);
    }
  }, 100);
});

const addPlayerControls = async (player: Player) => {
  const controls = player.parentElement.querySelectorAll('.icon-spacing');
  const left = controls[controls.length - 1];
  left.prepend(await createSpeedDial(player, options));
};

export const updatePlayerControls = (player: Player, canNext: boolean, canPrev: boolean) => {
  if (!player) return; // TODO
  // (player.controlBar.getChild('QueueNext') as InstanceType<Comp<typeof QueueButton>>).toggle(canNext);
  // (player.controlBar.getChild('QueuePrev') as InstanceType<Comp<typeof QueueButton>>).toggle(canPrev);
};

const keydownHandler = (e: KeyboardEvent) => {
  if (e.altKey || e.ctrlKey || e.metaKey)
    return;
  if (document.activeElement.tagName === 'INPUT')
    return;
  const pressedKey = e.key;
  const player = findAPlayer();
  if (!player)
    return;

  switch (pressedKey) {
    case ',':
      player.currentTime = player.currentTime - 0.03; // "frame" back
      break;
    case '.':
      player.currentTime = player.currentTime + 0.03; // "frame" forward
      break;
    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
      player.currentTime = player.duration * (+pressedKey) / 10;
      break;
    case 'Home':
      player.currentTime = 0;
      break;
    case 'End':
      player.currentTime = player.duration;
      break;
    case '<':
      player.playbackRate = Math.max(Math.round((player.playbackRate - options.playbackChange) * 100) / 100, 0.1);
      break;
    case '>':
      player.playbackRate = Math.round((player.playbackRate + options.playbackChange) * 100) / 100;
      break;
    case ' ': // normally handled by video.js, but they don't use capture, see #12
      player.paused ? player.play() : player.pause();
      break;
    case 'n':
      sendMessage(Message.QUEUE_NEXT, null, false);
      break;
    case 'p':
      sendMessage(Message.QUEUE_PREV, null, false);
      break;
    default:
      return;
  }
  e.stopPropagation();
  e.preventDefault();
};

const wheelHandler = async (e: WheelEvent) => {
  if (!options.volumeEnabled)
    return;
  const player = findAPlayer();
  if (!player)
    return;
  const target = e.target as HTMLElement;
  if (target.closest('div#video-player') === null) // only consider sub-elements of player
    return;
  e.stopPropagation();
  e.preventDefault();

  // use polynomial as approximation for logarithmic scale (https://www.dr-lex.be/info-stuff/volumecontrols.html)
  // using x^2 now because x^4 is too aggressive for this range
  const pow = 2;
  const cur = options.volumeLog ? Math.pow(player.volume, 1 / pow) : player.volume; // root
  const v = cur - Math.sign(e.deltaY) * options.volumeChange;
  const n = options.volumeLog ? Math.pow(Math.max(v, 0), pow) : v; // if log, also take care that it's not negative (x^2 increases again below x=0)
  player.volume = e.deltaY * options.volumeChange > 0 && n < 0.01 ? 0 : n; // lower volume and below threshold -> mute

  // (player.controlBar.getChild('VolumeText') as InstanceType<Comp<typeof VolumeText>>).show(); TODO
};

const clickHandler = (e: MouseEvent) => {
  if (!options.useFirstSubtitle)
    return;
  const player = findAPlayer();
  if (!player)
    return;
  const target = e.target as HTMLElement;
  if (target.closest('#subtitles-button') === null) // clicked subtitles button
    return;
  const subs = arrFromLengthy(player.textTracks).filter(e => e.kind === 'subtitles');
  if (subs.length !== 1)
    return;
  // only one subtitle track (not already active), use it and prevent popup
  e.stopPropagation();
  e.preventDefault();
  const { label } = subs[0];
  if (subs[0].mode === 'showing') {
    subs[0].mode = 'hidden';
    console.dev.log(`Set subtitle track '${label}' inactive`);
    window.localStorage.removeItem('player-v2-subtitle-track');
  } else {
    subs[0].mode = 'showing';
    console.dev.log(`Set subtitle track '${label}' active`);
    window.localStorage.setItem('player-v2-subtitle-track', JSON.stringify(label));
  }
};
