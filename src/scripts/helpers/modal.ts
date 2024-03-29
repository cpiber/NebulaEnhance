import closeIcon from '../../icons/close.svg';
import iconThreeDots from '../../icons/three-dots.svg';

export const buildModal = (title: string, body?: Element, classes: string = undefined, ...more: Element[]) => {
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
  if (body) content.append(body);
  content.append(...more);
  return new Promise(resolve => {
    close.addEventListener('click', () => {
      wrapper.style.display = 'none';
      resolve(void 0);
    });
  });
};

type RetPromise<T> = T extends (...args: any[]) => infer R ? R extends Promise<any> ? R : Promise<R> : never;
export const withLoader = <T extends (...args: any[]) => any>(fn: T) => {
  return (...args: FnArgs<T>): RetPromise<T> => {
    const loading = document.querySelector<HTMLDivElement>('body > .loading') || document.body.appendChild(document.createElement('div'));
    loading.innerHTML = iconThreeDots;
    loading.className = 'loading';
    loading.style.display = '';
    return Promise.resolve(fn(...args)).finally(() => loading.style.display = 'none') as RetPromise<T>;
  };
};
