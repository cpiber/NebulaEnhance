import { getBrowserInstance } from '../helpers/sharedExt';
import { Settings, toData } from './settings';

const els = Settings.get();
const { local } = getBrowserInstance().storage;

export const save = () => local.set(toData());
export const load = async (doSave = false) => {
  const data = await local.get(toData(true));
  Object.keys(els).forEach(prop => {
    if (els[prop].type === 'checkbox') {
      (els[prop] as HTMLInputElement).checked = !!data[prop];
    } else {
      els[prop].value = data[prop];
    }
  });

  if (doSave)
    save();
};

const delayedSave = (e: Event) => {
  const el = (e.target as HTMLInputElement | HTMLTextAreaElement);
  const timeout = +el.dataset.timeout || 0;
  clearTimeout(timeout);
  el.dataset.timeout = '' + setTimeout(save, 400);
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

// label animation
const setInputClass = (el: HTMLInputElement) => {
  if(el.value === '' || !el.value) {
    el.classList.remove('has-value');
  } else {
    el.classList.add('has-value');
  }
};
Array.from(document.querySelectorAll<HTMLInputElement>('.enhancer-text-input')).forEach(e => {
  setInputClass(e);
  e.addEventListener('change', ev => {
    setInputClass(ev.target as HTMLInputElement);
  });
});
