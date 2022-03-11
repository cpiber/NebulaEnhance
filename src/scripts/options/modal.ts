import DOMPurify from 'dompurify';
import marked from 'marked';
import closeIcon from '../../icons/close.svg';

export const buildModal = (title: string, body: string, classes: string = undefined, ...more: HTMLElement[]) => {
  const wrapper = document.querySelector<HTMLDivElement>('.modal__wrapper') || document.body.appendChild(document.createElement('div'));
  wrapper.classList.add('modal__wrapper', classes);
  wrapper.innerHTML = '';
  wrapper.style.display = '';
  const el = wrapper.appendChild(document.createElement('div'));
  el.className = 'modal options-modal';
  const inner = el.appendChild(document.createElement('div'));
  inner.className = 'modal__inner';
  const heading = inner.appendChild(document.createElement('div'));
  heading.className = 'heading';
  heading.appendChild(document.createElement('h1')).innerText = title;
  const close = heading.appendChild(document.createElement('span'));
  close.className = 'close';
  close.innerHTML = closeIcon;
  const content = inner.appendChild(document.createElement('div'));
  content.className = 'body content';
  content.innerHTML = DOMPurify.sanitize(marked(body));
  content.append(...more);
  close.addEventListener('click', () => wrapper.style.display = 'none');
  return wrapper;
};