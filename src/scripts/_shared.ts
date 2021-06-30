export const videosettings = {
    playbackRate: null as number,
    volume: null as number,
    quality: null as number,
    subtitles: null as string
};

export type ytvideo = {
    confidence: number,
    video: string,
};

Array.prototype.occurence = function <T>(this: Array<T>) {
    return [...this].sort().reduce((prev, cur) => {
        if (cur === prev.values[prev.values.length - 1]) {
            prev.occurences[prev.occurences.length - 1]++; // increase frequency
            return prev;
        }
        // new element
        prev.values.push(cur);
        prev.occurences.push(1);
        return prev;
    }, { values: [] as Array<T>, occurences: [] as Array<number> });
};
Array.prototype.equals = function <T>(this: Array<T>, other: Array<T>) { return this.length === other.length && this.every((v, i) => v === other[i]); }
Number.prototype.pad = function (this: number, length: number) { return ("" + this).padStart(length, "0"); }

export const dot = (t1: number[], t2: number[]) => t1.length === t2.length && t1.reduce((prev, cur, index) => prev + cur * t2[index], 0)
export const norm = (t: number[]) => Math.sqrt(t.reduce((p, v) => p + v * v, 0));
