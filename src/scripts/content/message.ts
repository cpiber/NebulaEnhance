import { Events, Message, getBrowserInstance, isQueueMessage, parseTypeObject, replyMessage } from '../helpers/sharedExt';
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
  if (msg.type.startsWith('enhancer-message-'))
    return true; // ignore replies

  if (isQueueMessage(msg.type))
    return Queue.get().handleMessage(e, msg);

  let promise: Promise<any> = null;
  switch (msg.type) {
    case Message.GET_STORAGE:
      promise = local.get(msg.get);
      break;
    case Message.GET_MESSAGE:
      promise = Promise.resolve(getBrowserInstance().i18n.getMessage(msg.message));
      break;
    case Message.GET_QSTATUS:
      promise = Promise.resolve({
        canNext: Queue.get().canGoNext(),
        canPrev: Queue.get().canGoPrev(),
        position: Queue.get().position,
        length: Queue.get().length,
      });
      break;
    case Message.REGISTER_LISTENER:
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
    case Events.QUEUE_CHANGE:
      Queue.get().onChange(() => replyMessage(e, msg.name, { canNext: Queue.get().canGoNext(), canPrev: Queue.get().canGoPrev() }));
      break;
  }
};