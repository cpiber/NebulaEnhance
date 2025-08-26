// Internal
export const enum Message {
  QUEUE_NEXT = 'queueGotoNext',
  QUEUE_PREV = 'queueGotoPrev',

  GET_STORAGE = 'getStorage',
  GET_MESSAGE = 'getMessage',
  GET_QSTATUS = 'getQueueStatus',

  REGISTER_LISTENER = 'registerListener',

  // why are these not camel-case like the others...
  HISTORY = 'enhancer-history',
  HISTORY_SETUP = 'enhancer-history-setup',

  GET_BROWSE_ID = 'YTgetBrowseId',
  GET_BROWSE_ID_MOBILE = 'YTgetBrowseIdMobile',
  GET_VID_ID_MOBILE = 'YTgetVidIdMobile',
  PAUSE_YT_VIDEO = 'YTpauseVideo',
  MUTE_YT_VIDEO = 'YTmuteVideo',
}
export const isQueueMessage = (msg: string) => msg.startsWith('queue');

export const enum Event {
  QUEUE_CHANGE = 'queueChange',
  STORAGE_CHANGE = 'storageChange',
}

export const DRAG_INDEX = 'text/index';
export const DRAG_HEIGHT = 'text/height';
export const QUEUE_KEY = 'enhancer-queue';


export const enum BrowserMessage {
  INIT_PAGE = 'initPageScript',
  LOAD_CREATORS = 'loadCreators',
  GET_YTID = 'getYoutubeId',
  GET_VID = 'getNebulaVid',
}

export const QualityType = {
  Off: 'Off',
  Highest: 'Highest',
  Lowest: 'Lowest',
  PreferredChooseHigher: 'PreferredChooseHigher',
  PreferredChooseLower: 'PreferredChooseLower',
} as const;