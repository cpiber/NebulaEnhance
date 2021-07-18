
export const videoSelector = 'a[href^="/videos/"]';
export const qbuttSelector = '.enhancer-queueButton';
export const queueSelector = '.enhancer-queue';

export const addToQueue = async (num: number, offset = 0) => {
  for (let index = 0; index < num; index++) {
    await page.hover(`${videoSelector}:nth-child(${index+1+offset}) img`);
    await page.click(`${videoSelector}:nth-child(${index+1+offset}) ${qbuttSelector}`);
  }
};
export const expectQueueLength = () => expect(page.evaluate(sel => document.querySelector(`${sel} .elements`).children.length, queueSelector)).resolves;
export const titles = () => page.evaluate(sel => Array.from(document.querySelectorAll(`${sel} .element .title`)).map(n => n.textContent), queueSelector);