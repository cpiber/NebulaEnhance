import type { History } from 'history';
import { Settings, builtin as builtinComponents, slot as componentSlot, toSorted as componentsSorted, ours as oursComponents, setDefaultIds } from './components';
import createExpandButton from './components/expand';
import { findTime } from './components/htmlhelper';
import createQueueButton, { toggleQueueButton } from './components/queue';
import createSpeedDial from './components/speeddial';
import attachVolumeText, { toggleVolumeShow } from './components/volume';
import { init as initDispatch, loadPrefix, navigatePrefix } from './dispatcher';
import { Message, arrFromLengthy, getFromStorage, notification, onStorageChange, parseTypeObject, replyMessage, sendMessage } from './sharedpage';

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
  autoExpand: false,
  playerSettings: {} as Partial<Settings>,
};
let options = { ...optionsDefaults };
let lastPositon: number | undefined = undefined;
const msgs: Record<string, string> = {};

type Msg = { type: string, name?: string, [key: string]: any; };

export const init = async () => {
  window.addEventListener('message', (e) => {
    const msg = parseTypeObject<Msg>(e.data, true);
    if (msg === null)
      return true; // ignore invalid messages
    if (msg.type.startsWith('enhancer-message-') || msg.type.startsWith('enhancer-event-'))
      return true; // ignore replies and events
    console.dev.debug('[Player] Handling message', msg);

    switch (msg.type) {
      case Message.HISTORY_SETUP: {
        try {
          replyMessage(e, msg.name, setupHistory(), null);
        } catch (err) {
          replyMessage(e, msg.name, null, err);
        }
      } break;
    }
  });

  const {
    playbackChange, autoplay, autoplayQueue, volumeEnabled,
    volumeChange, volumeLog, volumeShow, useFirstSubtitle, autoExpand,
  } = options = await getFromStorage(optionsDefaults);
  console.debug('playbackChange:', playbackChange, 'autoplay?', autoplay, 'autoplay in queue?', autoplayQueue,
    '\nvolume scroll?', volumeEnabled, 'change:', volumeChange, 'log?', volumeLog, 'show?', volumeShow,
    '\nuse first subtitle?', useFirstSubtitle, 'expand video?', autoExpand);

  document.addEventListener('keydown', keydownHandler, { capture: true });
  document.addEventListener('wheel', wheelHandler, { passive: false });
  document.addEventListener(`${loadPrefix}-video`, initPlayer);
  document.addEventListener(navigatePrefix, () => lastPositon = undefined);
  await initDispatch();

  msgs['playerFrameBack'] = await sendMessage(Message.GET_MESSAGE, { message: 'playerFrameBack' });
  msgs['playerFrameForward'] = await sendMessage(Message.GET_MESSAGE, { message: 'playerFrameForward' });
  msgs['playerSpeed'] = await sendMessage(Message.GET_MESSAGE, { message: 'playerSpeed' });

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
    toggleVolumeShow(player, options.volumeShow);
    addPlayerControls(player);
  });
};

export const initPlayer = async () => {
  const player = await getAPlayer();

  if (!player || player._enhancerInit)
    return; // already initialized this player
  await waitForButtonsAndSetIds();

  player.addEventListener('ended', () => sendMessage(Message.QUEUE_NEXT, null, false));

  const { autoplay, autoplayQueue } = options;
  console.debug('autoplay?', autoplay, 'autoplayQueue?', autoplayQueue);
  await addPlayerControls(player);
  if (options.autoExpand) document.body.parentElement.classList.toggle('enhancer-fullVideo');

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

export const findAPlayer = () => document.querySelector<Player>('#video-player video');

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
const waitForButtonsAndSetIds = (maxiter: number | null = 10) => new Promise((resolve, reject) => {
  let iter = 0;
  const i = window.setInterval(() => {
    try {
      setDefaultIds();
      window.clearInterval(i);
      resolve(void 0);
    } catch (err) {
      if (maxiter !== null && iter++ > maxiter) {
        window.clearInterval(i);
        reject(err);
        return;
      }
    }
  }, 100);
});
export const waitForSubtitles = (player: Player, maxiter: number | null = 10) => new Promise<HTMLElement>((resolve, reject) => {
  let iter = 0;
  const i = window.setInterval(() => {
    if (maxiter !== null && iter++ > maxiter) {
      window.clearInterval(i);
      reject('No element found');
      return;
    }
    const sub = player.parentElement.querySelector<HTMLElement>('#subtitles-toggle-button');
    if (sub) {
      window.clearInterval(i);
      resolve(sub);
    }
  }, 100);
});

let playerControlLock = false;
const addPlayerControls = async (player: Player) => {
  if (playerControlLock) return;
  playerControlLock = true;
  try {
    await waitForSubtitles(player);
  } catch { }

  const controls = player.parentElement.querySelectorAll('.icon-spacing');
  const left = controls[0];
  const right = controls[controls.length - 1];
  const collect = (id: string) => {
    if (id === 'time') return findTime(controls);
    let node = player.parentElement.querySelector(`#${id}`);
    console.dev.debug(id, node);
    while (node !== null) {
      const parent = node.parentElement;
      if (parent === left || parent === right) break;
      node = parent;
    }
    return node;
  };
  const builtins = builtinComponents.map(collect);
  const ours = oursComponents.map(collect);
  for (let i = 0; i < oursComponents.length; i++) {
    if (ours[i] !== null) continue;
    if (oursComponents[i] === 'queue-prev') {
      ours[i] = await createQueueButton(player, false);
    } else if (oursComponents[i] === 'queue-next') {
      ours[i] = await createQueueButton(player, true);
    } else if (oursComponents[i] === 'expand') {
      ours[i] = await createExpandButton(player);
    } else if (oursComponents[i] === 'speeddial') {
      ours[i] = await createSpeedDial(player, options);
    } else {
      console.assert(false, 'Unknown component', oursComponents[i]);
    }
  }
  // remove from DOM for insertion in order
  while (left.childNodes.length > 0) left.childNodes[0].remove();
  while (right.childNodes.length > 0) right.childNodes[0].remove();

  const sorted = componentsSorted(options.playerSettings);
  for (const comp of sorted) {
    const container = componentSlot(comp, options.playerSettings[comp], left, right);
    const bidx = builtinComponents.indexOf(comp as any);
    const oidx = oursComponents.indexOf(comp as any);
    if (bidx >= 0 && builtins[bidx] !== null) {
      builtins[bidx].classList.remove('enhancer-hidden');
      container.appendChild(builtins[bidx]);
    } else if (oidx >= 0 && ours[oidx] !== null) {
      ours[oidx].classList.remove('enhancer-hidden');
      container.appendChild(ours[oidx]);
    }
  }
  // re-attach disabled components for compatibility
  for (let i = 0; i < builtinComponents.length; i++) {
    if (options.playerSettings[builtinComponents[i]]?.enabled ?? true) continue;
    builtins[i].classList.add('enhancer-hidden');
    left.appendChild(builtins[i]);
  }
  for (let i = 0; i < oursComponents.length; i++) {
    if (options.playerSettings[oursComponents[i]]?.enabled ?? true) continue;
    ours[i].classList.add('enhancer-hidden');
    left.appendChild(ours[i]);
  }

  attachVolumeText(player, controls, options);
  playerControlLock = false;
};

export const updatePlayerControls = (player: Player, canNext: boolean, canPrev: boolean) => {
  if (!player) return;
  toggleQueueButton(player, true, canNext);
  toggleQueueButton(player, false, canPrev);
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
  const wrapper = player.closest<HTMLElement>('#video-player');

  switch (pressedKey) {
    case ',':
      player.currentTime = player.currentTime - 0.03; // "frame" back
      notification(msgs['playerFrameBack'], 1000, wrapper);
      break;
    case '.':
      player.currentTime = player.currentTime + 0.03; // "frame" forward
      notification(msgs['playerFrameForward'], 1000, wrapper);
      break;
    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
      lastPositon = player.currentTime;
      player.currentTime = player.duration * (+pressedKey) / 10;
      break;
    case 'Home':
      lastPositon = player.currentTime;
      player.currentTime = 0;
      break;
    case 'End':
      lastPositon = player.currentTime;
      player.currentTime = player.duration;
      break;
    case '<':
      player.playbackRate = Math.max(Math.round((player.playbackRate - options.playbackChange) * 100) / 100, 0.1);
      notification(`${msgs['playerSpeed']}: ${player.playbackRate}`, 1000, wrapper);
      break;
    case '>':
      player.playbackRate = Math.round((player.playbackRate + options.playbackChange) * 100) / 100;
      notification(`${msgs['playerSpeed']}: ${player.playbackRate}`, 1000, wrapper);
      break;
    case ' ': // normally handled by video.js, but they don't use capture, see #12
      if (player.paused) player.play(); else player.pause();
      break;
    case 'x':
      document.body.parentElement.classList.toggle('enhancer-fullVideo');
      break;
    case 'n':
      sendMessage(Message.QUEUE_NEXT, null, false);
      break;
    case 'p':
      sendMessage(Message.QUEUE_PREV, null, false);
      break;
    case 'z': {
      const curPos = player.currentTime;
      if (lastPositon != undefined) player.currentTime = lastPositon;
      lastPositon = curPos;
    } break;
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
  player.volume = Math.min(e.deltaY * options.volumeChange > 0 && n < 0.01 ? 0 : n, 1); // lower volume and below threshold -> mute

  // (player.controlBar.getChild('VolumeText') as InstanceType<Comp<typeof VolumeText>>).show(); TODO
};

export const setupHistory = () => {
  try {
    const root = document.getElementById('root');
    for (const key of Object.keys(root)) {
      if (key.startsWith('__reactContainer')) {
        let obj = root[key] as any;
        while (true) {
          if (obj.stateNode && obj.stateNode.history) {
            if (obj.stateNode.history.__enhancer_handled) return true;
            /* eslint-disable-next-line camelcase */
            obj.stateNode.history.__enhancer_handled = true;
            const history = obj.stateNode.history as History;
            window.addEventListener('message', ev => {
              try {
                const data = JSON.parse(ev.data);
                if (data.type !== Message.HISTORY) return;
                switch (data.action) {
                  case 'push':
                    history.push(data.to, data.state);
                    break;
                  case 'replace':
                    history.replace(data.to, data.state);
                    break;
                }
              } catch { }
            });
            return true;
          }
          if (!obj.child) break;
          obj = obj.child;
        }
        break;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return false;
};