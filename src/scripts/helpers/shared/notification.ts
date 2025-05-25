let timeout = 0;
const stop = () => {
  window.clearTimeout(timeout);
  timeout = 0;
};

export const notification = (text: string | HTMLElement, duration: number | null = 1600, source: HTMLElement = document.body) => {
  if (timeout) {
    stop();
  }
  const existing = source.querySelector<HTMLDivElement>('.notification');
  const n = existing || source.appendChild(document.createElement('div'));
  n.classList.add('notification');
  const content = typeof text === 'string' ? document.createTextNode(text) : text;
  n.replaceChildren(content);

  const hide = () => {
    n.classList.remove('show');
    stop();
  };

  const show = () => {
    n.classList.add('show');
    if (duration !== null)
      timeout = window.setTimeout(hide, duration);
  };
  // when creating a new element, make sure it first has its position outside the viewport, to play animation
  if (existing === null) window.setTimeout(show, 1);
  else show();
  return hide;
};
