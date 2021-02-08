import { THEOplayer } from "./theoplayer";

declare global {
    interface Window {
        THEOplayer: typeof THEOplayer;
        theoplayer: THEOplayer.Player;
    }
}