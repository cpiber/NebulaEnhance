import { getBrowserInstance, notification } from '../helpers/sharedExt';
import { buildModal } from './modal';

const msg = getBrowserInstance().i18n.getMessage;

const inputModalBody = () => {
  const div = document.createElement('form');
  div.className = 'enhancer-field';
  div.style.padding = '0';
  const control = div.appendChild(document.createElement('div'));
  control.className = 'enhancer-control';
  const input = control.appendChild(document.createElement('input'));
  input.className = 'enhancer-text-input';
  input.type = 'text';
  input.placeholder = 'https://invidious.example.com';
  input.id = 'invidiousInstanceInput';
  const label = control.appendChild(document.createElement('label'));
  label.textContent = msg('optionsInvidiousAddLabel');
  label.htmlFor = 'invidiousInstanceInput';

  const buttonControl = div.appendChild(document.createElement('div'));
  buttonControl.className = 'enhancer-control';
  const addButton = buttonControl.appendChild(document.createElement('button'));
  addButton.type = 'submit';
  addButton.className = 'i18n enhancer-button';
  addButton.textContent = msg('optionsInvidiousAdd');
  div.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = input.value.trim();
    if (!url) return;
    let perm: string;
    try {
      const u = new URL(url);
      if (!u.protocol.startsWith('http')) throw new Error('Invalid protocol');
      perm = `*://${u.host}/*`;
    } catch (e) {
      notification(e.message || e);
      return;
    }
    getBrowserInstance().permissions.request({ origins: [perm] }).then(success => {
      if (success) {
        input.value = '';
      }
    });
  });
  return div;
};

export const showAddInstance = () => buildModal(msg('optionsInvidiousAddTitle'), msg('optionsInvidiousAddDescription'), undefined, inputModalBody());
