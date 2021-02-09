import { getBrowserInstance } from "../_shared";

const els: { [key: string]: HTMLInputElement } = {
    playbackRate: document.querySelector('[name="playbackRate"]'),
    targetQualities: document.querySelector('[name="targetQualities"]'),
    playbackChange: document.querySelector('[name="playbackChange"]'),
};
const local = getBrowserInstance().storage.local;

const toData = (useDefaults = false) => {
    const data: { [key in keyof typeof els]?: string | number | string[] | number[] } = {};
    Object.keys(els).map(key => {
        data[key] = !useDefaults ? els[key].value : els[key].dataset.default;
        data[key] = els[key].type === "number" ? +data[key] : data[key];
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
    for (const prop in els) 
        els[prop].value = data[prop];
    els.targetQualities.value = (data.targetQualities as string[]).join(', ');
    if (doSave)
        save();
});

const form = document.querySelector('form');
form.addEventListener('submit', e => {
    e.preventDefault();
    save();
});
Array.from(form.querySelectorAll('input')).forEach(e => e.addEventListener('focusout', save)); // autosave

// load translations
Array.from(document.querySelectorAll('.i18n')).forEach(e => {
    e.innerHTML = e.innerHTML.replace(/__MSG_(.+)__/g, (...args) => getBrowserInstance().i18n.getMessage(args[1]));
    e.classList.remove('i18n');
});

// load initial values from storage
load(true);