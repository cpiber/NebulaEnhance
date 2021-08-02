import { clone, getBrowserInstance, videosettings } from '../helpers/sharedBrowser';
import { Queue } from './queue';

const local = getBrowserInstance().storage.local;

const replyMessage = (e: MessageEvent, name: string, data: any, err?: any) => name &&
  // @ts-ignore
  e.source.postMessage(
    clone({ type: name, res: data, err: err }),
    e.origin
  );

const parse = (e: MessageEvent) => {
  if (!e.origin.match(/^https?:\/\/(?:player.zype.com|(?:.+\.)?nebula.app)$/))
    return null;
  let d = e.data;
  try {
    d = JSON.parse(d);
  } catch (err) {
  }
  const msg = (typeof d === "string" ? { type: d } : d) as { type: string, [key: string]: any };
  if (msg.type?.startsWith('enhancer-message-'))
    return null; // reply
  return msg;
};

/**
 * handle postMessage event
 * @returns `true` if event handeled, else parsed message
 */
export const handle = (e: MessageEvent) => {
  const msg = parse(e);
  if (msg === null)
    return true;
  
  if (msg.type?.startsWith('queue'))
    return Queue.get().handleMessage(e, msg);
  
  let promise: Promise<any> = null;
  switch (msg.type) {
    case "getSetting":
      const setting = msg.setting;
      promise = Promise.resolve(setting ? videosettings[setting as keyof typeof videosettings] : videosettings);
      break;
    case "setSetting":
      const v = isNaN(msg.value) || msg.value == "" ? msg.value as string : +msg.value;
      videosettings[setting as keyof typeof videosettings] = v as never;
      return true;
    case "getStorage":
      promise = local.get(msg.get);
      break;
    case "getMessage":
      promise = Promise.resolve(getBrowserInstance().i18n.getMessage(msg.message));
      break;
    default:
      return msg;
  }
  promise.then(val => replyMessage(e, msg.name, val, null)).catch(err => replyMessage(e, msg.name, null, err));
  return true;
};