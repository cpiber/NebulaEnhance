import { THEOplayer } from "./theoplayer";

declare global {
    interface Window {
        THEOplayer: typeof THEOplayer;
        theoplayer: THEOplayer.Player;
    }

    interface Array<T> {
        equals(other: Array<T>): boolean;
        occurence(): { values: Array<T>, occurences: Array<number>};
    }

    interface Number {
        pad(length: number): string;
    }

    const __YT_API_KEY__: string;
}