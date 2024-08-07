import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { buildModal as build } from '../helpers/modal';
export { buildModal as buildModalDirect, withLoader } from '../helpers/modal';

export const buildModal = async (title: string, body: string, classes: string = undefined, ...more: HTMLElement[]) => {
  const e = document.createElement('div');
  e.innerHTML = DOMPurify.sanitize(await marked(body));
  return build(title, undefined, classes, ...Array.from(e.children), ...more);
};
