import { THEOplayer } from "./theoplayer";

declare global {
    interface Window {
        THEOplayer: typeof THEOplayer;
        theoplayer: THEOplayer.Player;
    }

    interface Array<T> {
        equals(other: Array<T>): boolean;
    }

    interface Number {
        pad(length: number): string;
    }
}