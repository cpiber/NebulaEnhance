
let timeout = 0;
const stop = () => {
  window.clearTimeout(timeout);
  timeout = 0;
};

export const notification = (text: string | HTMLElement, duration = 1600) => {
  if (timeout) {
    stop();
    document.querySelector('.notification')?.remove();
  }
  const n = document.querySelector<HTMLDivElement>('.notification') || document.body.appendChild(document.createElement('div'));
  n.classList.add('notification');
  n.classList.remove('show');
  const content = typeof text === 'string' ? document.createTextNode(text) : text;
  n.replaceChildren(n.appendChild(content));
  timeout = window.setTimeout(() => {
    n.classList.add('show');
    timeout = window.setTimeout(() => (n.classList.remove('show'), stop()), duration);
  }, 10); // to allow transition to run
};