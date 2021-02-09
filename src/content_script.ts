import { getBrowserInstance } from "./_shared";

function injectScript(node: HTMLElement, content: string, friendly?: string, data?: any): Promise<void>;
function injectScript(file: string, node: HTMLElement, friendly?: string, data?: any): Promise<void>;
function injectScript(file: any, node: any, friendly?: string, data?: any) {
    return new Promise(resolve => {
        const gotSrc = typeof (node as HTMLElement).appendChild !== "undefined";
        const n: HTMLElement = gotSrc ? node : file;
        const f: string = gotSrc ? file : node;

        const s = document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        const end = () => {
            s.remove();
            if (data) document.dispatchEvent(new CustomEvent(`enhancer-load-${friendly}`, { detail: data }));
            resolve(void 0);
        };
        s.addEventListener('load', end);
        if (gotSrc)
            s.setAttribute('src', f);
        else
            s.textContent = f;
        n.appendChild(s);
        if (!gotSrc)
            end(); // no on-load, do it manually
    });
}

function c(data: any) {
    // @ts-ignore
    return typeof cloneInto !== "undefined" ? cloneInto(data, document.defaultView) : data;
}

const b = getBrowserInstance();
const local = b.storage.local;

// handle messaging with injected script(s)
const replyEvent = (e: CustomEvent, data: any, err?: any) => document.dispatchEvent(new CustomEvent(e.detail.name, { detail: c({ res: data, err: err }) }));
const storageGet = (e: CustomEvent) => local.get(e.detail.get as Object).then(r => replyEvent(e, typeof e.detail.get == 'string' ? r[e.detail.get] : r), (r: any) => replyEvent(e, null, r));
const storageSet = (e: CustomEvent) => local.set(e.detail.set as null).then(() => replyEvent(e, null), (r: any) => replyEvent(e, null, r));
const getMessage = (e: CustomEvent) => replyEvent(e, b.i18n.getMessage(e.detail.message, e.detail.substitutions));
const getAndroid = (e: CustomEvent) => b.runtime.sendMessage("isAndroid" as null).then((m: any) => replyEvent(e, m));



(async () => {
    if (document.body.classList.contains('enhancer'))
        return;
    document.body.classList.add('enhancer');
    
    document.addEventListener('enhancer-storageGet', storageGet);
    document.addEventListener('enhancer-storageSet', storageSet);
    document.addEventListener('enhancer-getMessage', getMessage);
    document.addEventListener('enhancer-isAndroid', getAndroid);

    // inject extension's script
    await injectScript(b.runtime.getURL('/zype.js'), document.body);
    // inject custom script (if available)
    const s = (await local.get({ customScript: '' })).customScript;
    if (s)
        injectScript(document.body, s);
})();