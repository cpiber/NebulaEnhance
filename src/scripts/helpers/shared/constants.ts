// Internal
export const enum Message {
  QUEUE_NEXT = 'queueGotoNext',
  QUEUE_PREV = 'queueGotoPrev',

  GET_STORAGE = 'getStorage',
  GET_MESSAGE = 'getMessage',
  GET_QSTATUS = 'getQueueStatus',

  REGISTER_LISTENER = 'registerListener',
}
export const isQueueMessage = (msg: string) => msg.startsWith('queue');

export const enum Events {
  QUEUE_CHANGE = 'queueChange',
}

export const DRAG_INDEX = 'text/index';
export const DRAG_HEIGHT = 'text/height';


export const enum BrowserMessage {
  LOAD_CREATORS = 'loadCreators',
  GET_YTID = 'getYoutubeId',
}


// Nebula
export const NEBULA_AUTH_KEY = 'nebula-auth';