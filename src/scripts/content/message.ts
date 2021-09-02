import { getBrowserInstance, parseTypeObject, replyMessage, videosettings } from '../helpers/sharedExt';
import { Queue } from './queue';

const { local } = getBrowserInstance().storage;
type Msg = { type: string, name?: string, [key: string]: any };

/**
 * handle postMessage event
 * @returns `true` if event handeled, else parsed message
 */
export const handle = (e: MessageEvent) => {
  if (!e.origin.match(/^https?:\/\/(?:.+\.)?nebula.app$/))
    return true;
  const msg = parseTypeObject<Msg>(e.data, true);
  if (msg === null)
    return true; // ignore invalid messages
  if (msg.type?.startsWith('enhancer-message-'))
    return true; // ignore replies

  if (msg.type?.startsWith('queue'))
    return Queue.get().handleMessage(e, msg);

  let promise: Promise<any> = null;
  switch (msg.type) {
    case 'getSetting': {
      const { setting } = msg;
      promise = Promise.resolve(setting ? videosettings[setting as keyof typeof videosettings] : videosettings);
      break;
    }
    case 'setSetting': {
      const { setting } = msg;
      const v = isNaN(msg.value) || msg.value == '' ? msg.value as string : +msg.value;
      videosettings[setting as keyof typeof videosettings] = v as never;
      return true;
    }
    case 'getStorage':
      promise = local.get(msg.get);
      break;
    case 'getMessage':
      promise = Promise.resolve(getBrowserInstance().i18n.getMessage(msg.message));
      break;
    case 'getQueueStatus':
      promise = Promise.resolve({ canNext: Queue.get().canGoNext(), canPrev: Queue.get().canGoPrev() });
      break;
    case 'registerListener':
      registerListener(e, msg);
      return true;
    default:
      return msg;
  }
  // use raw promises here because we don't care about the return value, let the rest of the handler continue
  promise.then(val => replyMessage(e, msg.name, val, null)).catch(err => replyMessage(e, msg.name, null, err));
  return true;
};

const registerListener = (e: MessageEvent, msg: Msg) => {
  switch (msg.event) {
    case 'queueChange':
      Queue.get().onChange(() => replyMessage(e, msg.name, { canNext: Queue.get().canGoNext(), canPrev: Queue.get().canGoPrev() }));
      break;
  }
};