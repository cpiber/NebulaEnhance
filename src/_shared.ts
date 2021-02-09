
export function getBrowserInstance(): typeof chrome {
    // Get extension api Chrome or Firefox
    // @ts-ignore
    const browserInstance = window.chrome || (window as any)['browser'] || browser;
    return browserInstance;
}

export const sendEvent = <T> (name: string, data?: any) => {
    return new Promise<T> ((resolve, reject) => {
        const e = `enhancer-event-${Math.random().toString().substr(2, 8)}`;
        const c = (ev: CustomEvent) => {
            document.removeEventListener(e, c);
            if (ev.detail.err)
                reject(ev.detail.err)
            else
                resolve(ev.detail.res);
        };
        document.addEventListener(e, c);
        document.dispatchEvent(new CustomEvent(`enhancer-${name}`, { detail: { name: e, ...data } }));
    });
}

export const SpeedClasses = "vjs-icon-circle-inner-circle vjs-button vjs-control theo-controlbar-button";