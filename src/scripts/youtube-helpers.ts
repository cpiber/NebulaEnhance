import { Message, parseTypeObject, replyMessage } from './page/sharedpage';
import { getBrowseId, getBrowseIdMobile, getVidIdMobile, muteVideo, pauseVideo } from './page/youtube';

type Msg = { type: string, name?: string, [key: string]: any; };

(async () => {
  if (document.body.classList.contains('enhancer-yt-page'))
    return;
  document.body.classList.add('enhancer-yt-page');

  window.addEventListener('message', (e) => {
    const msg = parseTypeObject<Msg>(e.data, true);
    if (msg === null)
      return true; // ignore invalid messages
    if (msg.type.startsWith('enhancer-message-') || msg.type.startsWith('enhancer-event-'))
      return true; // ignore replies and events
    console.dev.debug('[YT] Handling message', msg);

    try {
      switch (msg.type) {
        case Message.GET_BROWSE_ID: {
          replyMessage(e, msg.name, getBrowseId(), null);
        } break;
        case Message.GET_BROWSE_ID_MOBILE: {
          replyMessage(e, msg.name, getBrowseIdMobile(), null);
        } break;
        case Message.GET_VID_ID_MOBILE: {
          replyMessage(e, msg.name, getVidIdMobile(), null);
        } break;
        case Message.PAUSE_YT_VIDEO: {
          pauseVideo();
        } break;
        case Message.MUTE_YT_VIDEO: {
          muteVideo();
        } break;
      }
    } catch (err) {
      replyMessage(e, msg.name, null, err);
    }
  });
})();