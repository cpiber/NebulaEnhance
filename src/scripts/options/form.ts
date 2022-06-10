import { debounce, getBrowserInstance, getFromStorage, notification, setToStorage } from '../helpers/sharedExt';
import { Settings, toData } from './settings';

const els = Settings.get();
const savedtext = getBrowserInstance().i18n.getMessage('optionsSavedNote');

const save = async (showNotification = false) => {
  await setToStorage(await toData());
  if (showNotification) notification(savedtext);
};
export const load = async (doSave = false) => {
  const data = await getFromStorage(await toData(true));
  Object.keys(els).forEach(prop => {
    if (els[prop].type === 'checkbox') {
      (els[prop] as HTMLInputElement).checked = !!data[prop];
    } else {
      els[prop].value = `${data[prop]}`;
    }
  });

  if (doSave)
    save(false);
};

const debouncedSave = debounce(save, 400);
const delayedSave = () => toData().then(() => debouncedSave());

const form = document.querySelector('form');
form.addEventListener('submit', e => {
  e.preventDefault();
  save(true);
});
window.addEventListener('beforeunload', () => save());

// autosave
Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')).forEach(e => {
  e.addEventListener('focusout', delayedSave);
  e.addEventListener('change', delayedSave);
  e.addEventListener('keyup', delayedSave);
});

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
const setInputClass = (el: HTMLInputElement) => el.classList.toggle('has-value', !!el.value);
Array.from(document.querySelectorAll<HTMLInputElement>('.enhancer-text-input')).forEach(e => {
  setInputClass(e);
  e.addEventListener('change', ev => setInputClass(ev.target as HTMLInputElement));
});
