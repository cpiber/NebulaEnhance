import type { Browser } from 'puppeteer';

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

const formSelector = '#NebulaApp > :nth-child(2) > :nth-child(2) form';
let optionsURL: string;
const b = (browser as never as Browser);
declare const chrome: typeof browser;

export const login = async () => {
  console.log('Using base', __NEBULA_BASE__);
  
  await page.goto('chrome://settings');
  optionsURL = await page.evaluate(async () => (await chrome.management.getAll())[0].optionsUrl);
  await page.goto(`${__NEBULA_BASE__}/login`);
  if (await page.evaluate(() => document.cookie.indexOf('nebula-auth')) !== -1)
    return;

  await expect(page).toFillForm(formSelector, {
    email: __NEBULA_USER__,
    password: __NEBULA_PASS__,
  });
  await expect(page).toClick(`${formSelector} button`, { text: 'Sign In' });
  await page.waitForSelector('[href="/account"]'); // wait until logged in
};

export const setSettings = async (set: { [key: string]: string | boolean}) => {
  const pg = await b.newPage();
  await pg.goto(optionsURL);
  const form = await expect(pg).toMatchElement('form');
  for (const key in set) {
    if (typeof(set[key]) !== 'boolean')
      continue;
    // need to check booleans manually
    await form.$eval(`[name="${key}"]`, (el: HTMLInputElement, val: boolean) => el.checked = val, set[key]);
    delete set[key];
  }
  await expect(pg).toFillForm('form', set, { timeout: 1000 });
  await expect(pg).toClick('button[type="submit"]');
  await pg.close();
};

export const waitForPlayerInit = async () => {
  await page.waitForSelector('.video-js');
  await page.waitForFunction(() => window.videojs.players[Object.keys(window.videojs.players).find(k => window.videojs.players[k])]._enhancer_init);
};