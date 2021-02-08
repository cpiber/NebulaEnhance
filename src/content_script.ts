import { getBrowserInstance } from "./_shared";

function injectScript(file: string, node: HTMLElement, friendly?: string, data?: any) {
    const s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    s.addEventListener('load', () => {
        s.remove();
        if (data)
            document.dispatchEvent(new CustomEvent(`enhancer-load-${friendly}`, { detail: data }));
    });
    node.appendChild(s);
}

function c(data: any) {
    // @ts-ignore
    return typeof cloneInto !== "undefined" ? cloneInto(data, document.defaultView) : data;
}

const b = getBrowserInstance();
const local = b.storage.local;

const replyEvent = (e: CustomEvent, data: any) => document.dispatchEvent(new CustomEvent(e.detail.name, { detail: c(data) }));
const storageGet = (e: CustomEvent) => local.get(e.detail.get, r => replyEvent(e, { res: typeof e.detail.get == 'string' ? r[e.detail.get] : r, err: b.runtime.lastError }));
const storageSet = (e: CustomEvent) => local.set(e.detail.set, () => replyEvent(e, { err: b.runtime.lastError }));



(async () => {
    if (document.body.classList.contains('enhancer'))
        return;
    // document.body.classList.add('enhancer');

    console.log('load');
    document.addEventListener('enhancer-storageGet', storageGet);
    document.addEventListener('enhancer-storageSet', storageSet);

    injectScript(b.runtime.getURL('/zype.js'), document.body);
})();