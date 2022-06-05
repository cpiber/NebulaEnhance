
export const notification = (text: string | HTMLElement, duration = 1600) => {
  const n = document.querySelector<HTMLDivElement>('.notification') || document.body.appendChild(document.createElement('div'));
  n.classList.add('notification');
  setTimeout(() => n.classList.add('show'), 1); // to allow transition to run
  const content = typeof text === 'string' ? document.createTextNode(text) : text;
  n.replaceChildren(n.appendChild(content));
  setTimeout(() => n.classList.remove('show'), duration);
};
