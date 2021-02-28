import { getBrowserInstance } from "../scripts/_sharedBrowser";

const els: { [key: string]: HTMLInputElement | HTMLTextAreaElement } = {
    playbackRate: document.querySelector('[name="playbackRate"]'),
    playbackChange: document.querySelector('[name="playbackChange"]'),
    volume: document.querySelector('[name="volume"]'),
    autoplay: document.querySelector('[name="autoplay"]'),
    targetQualities: document.querySelector('[name="targetQualities"]'),
    youtube: document.querySelector('[name="youtube"]'),
    customScriptPage: document.querySelector('[name="customScriptPage"]'),
    customScript: document.querySelector('[name="customScript"]'),
};
const local = getBrowserInstance().storage.local;

const toData = (useDefaults = false) => {
    const data: { [key in keyof typeof els]?: string | number | string[] | number[] | boolean } = {};
    Object.keys(els).forEach(key => {
        let val: string | number | boolean = !useDefaults ? els[key].value : els[key].dataset.default;
        if (els[key].type === "number") {
            val = +val;
            if (isNaN(val) || val == 0)
                val = +els[key].dataset.default;
        } else if (els[key].type === "checkbox") {
            val = !useDefaults ? (els[key] as HTMLInputElement).checked : !!val;
        }
        data[key] = val;
    });

    // transforms
    const m = (data.targetQualities as string).match(/^\s*\[(.*)\]\s*/);
    if (m)
        data.targetQualities = m[1]; // remove [] around array
    data.targetQualities = (data.targetQualities as string).split(',').filter(e => e.trim() !== "").map(e => +e).filter(e => !isNaN(e));
    els.targetQualities.value = data.targetQualities.join(', ');

    return data;
}

const save = () => local.set(toData());
const load = (doSave = false) => local.get(toData(true)).then(data => {
    for (const prop in els) {
        if (els[prop].type === "checkbox") {
            (els[prop] as HTMLInputElement).checked = !!data[prop];
        } else {
            els[prop].value = data[prop];
        }
    }
    // transforms
    els.targetQualities.value = (data.targetQualities as string[]).join(', ');

    if (doSave)
        save();
});
const delayedSave = (e: Event) => {
    const el = (e.target as HTMLInputElement | HTMLTextAreaElement);
    const timeout = +el.dataset.timeout || 0;
    clearTimeout(timeout);
    el.dataset.timeout = "" + setTimeout(save, 400);
};

const form = document.querySelector('form');
form.addEventListener('submit', e => {
    e.preventDefault();
    save();
});

// autosave
Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')).forEach(e => {
    e.addEventListener('focusout', save);
    e.addEventListener('change', save);
});
Array.from(form.querySelectorAll('textarea')).forEach(e => e.addEventListener('keyup', delayedSave));

// load translations
Array.from(document.querySelectorAll('.i18n, title')).forEach(e => {
    e.innerHTML = e.innerHTML.replace(/__MSG_(.+)__/g, (...args) => getBrowserInstance().i18n.getMessage(args[1]));
    e.classList.remove('i18n');
});
Array.from(document.querySelectorAll<HTMLElement>('[data-i18n]')).forEach(e => {
    e.dataset.i18n.split(',').forEach(attr =>
        e.setAttribute(attr, e.getAttribute(attr).replace(/__MSG_(.+)__/g, (...args) => getBrowserInstance().i18n.getMessage(args[1]))));
    e.removeAttribute('data-i18n');
});

// permissions for youtube comments
const permissions = getBrowserInstance().permissions;
els.youtube.addEventListener('change', async () => {
    const y = els.youtube as HTMLInputElement;
    const perms: browser.permissions.Permissions = {
        origins: [
            "*://standard.tv/*",
            "*://*.googleapis.com/*"
        ]
    };
    const success = await (y.checked ? permissions.request : permissions.remove)(perms);
    if (!success) y.checked = !y.checked; // revert
    permissions.getAll().then(console.log);
    if (y.checked && success) getBrowserInstance().runtime.sendMessage('loadCreators');
});
permissions.onRemoved.addListener(p => p.origins?.length && ((els.youtube as HTMLInputElement).checked = false));

// load initial values from storage
load(true);