export const sendEvent = <T>(name: string, data?: any, expectAnswer = true) => {
    if (!expectAnswer) {
        document.dispatchEvent(new CustomEvent(`enhancer-${name}`, { detail: data }));
        return Promise.resolve(undefined);
    }
    return new Promise<T>((resolve, reject) => {
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
};
let origin = null as string;
export const sendMessage = <T>(name: string, data?: any, expectAnswer = true) => {
    if (origin === null) {
        try {
            try {
                window.parent.postMessage('test', "https://watchnebula.com")
                origin = "https://watchnebula.com";
            } catch {
                window.parent.postMessage('test', "http://watchnebula.com")
                origin = "http://watchnebula.com";
            }
        } catch {
            console.error('Invalid embed, cannot send messages.');
            return Promise.reject();
        }
    }
    if (!expectAnswer) {
        window.parent.postMessage({ type: name, ...data }, origin);
        return Promise.resolve(undefined);
    }
    return new Promise<T>((resolve, reject) => {
        const e = `enhancer-message-${Math.random().toString().substr(2, 8)}`;
        const c = (ev: MessageEvent) => {
            if (ev.origin !== origin) return;
            const msg = (typeof ev.data === "string" ? { type: ev.data } : ev.data) as { type: string, [key: string]: any };
            if (msg.type !== e) return;
            window.removeEventListener('message', c);
            if (ev.data.err)
                reject(ev.data.err)
            else
                resolve(ev.data.res);
        };
        window.addEventListener('message', c);
        window.parent.postMessage({ type: name, name: e, ...data }, origin);
    });
};

export const SpeedClasses = "vjs-icon-circle-inner-circle vjs-button vjs-control theo-controlbar-button";