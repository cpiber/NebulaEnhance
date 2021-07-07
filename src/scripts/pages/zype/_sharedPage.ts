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
export const sendMessage = <T>(name: string, data?: any, expectAnswer = true) => {
    if (!expectAnswer) {
        window.parent.postMessage(JSON.stringify({ type: name, ...data }), "*");
        return Promise.resolve(undefined);
    }
    return new Promise<T>((resolve, reject) => {
        const e = `enhancer-message-${Math.random().toString().substr(2, 8)}`;
        const c = (ev: MessageEvent) => {
            if (!ev.origin.match(/https?:\/\/(?:watchnebula.com|(?:[^.]+\.)?nebula.app)/)) return;
            const msg = (typeof ev.data === "string" ? { type: ev.data } : ev.data) as { type: string, [key: string]: any };
            if (msg.type !== e) return;
            window.removeEventListener('message', c);
            if (ev.data.err)
                reject(ev.data.err)
            else
                resolve(ev.data.res);
        };
        window.addEventListener('message', c);
        window.parent.postMessage(JSON.stringify({ type: name, name: e, ...data }), "*");
    });
};

const vjs = "vjs-button vjs-control theo-controlbar-button";
export const SpeedClasses = `vjs-icon-circle-inner-circle ${vjs} enhancer-speed`;
export const TheatreClasses = `vjs-icon-square ${vjs} enhancer-theatre`;