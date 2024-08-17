import { setTimeout } from 'node:timers/promises';
import type { Browser } from 'puppeteer';
import { videoselector as videoSelector } from '../src/scripts/helpers/shared/helpers';

export { videoSelector };
export const qbuttSelector = '.enhancer-queueButton';
export const queueSelector = '.enhancer-queue';

let actualVideoSelector: string = null;

export const getNthVideo = async (num: number) => {
  if (actualVideoSelector === null) actualVideoSelector = await page.$eval(videoSelector, el => el.parentElement.className);
  return `.${actualVideoSelector}:nth-child(${num})`;
};
export const addToQueue = async (num: number, offset = 0) => {
  for (let index = 0; index < num; index++) {
    await page.waitForSelector(`${await getNthVideo(index + 1 + offset)} img`);
    const eimg = await page.$(`${await getNthVideo(index + 1 + offset)} img`);
    await page.evaluate((elem: HTMLElement) => {
      elem?.scrollIntoView();
      window.scroll({ top: window.scrollY - 90 }); // scroll past nav bar
    }, eimg);
    await page.hover(`${await getNthVideo(index + 1 + offset)} img`);
    await page.waitForSelector(`${await getNthVideo(index + 1 + offset)} ${qbuttSelector}`);
    await page.click(`${await getNthVideo(index + 1 + offset)} ${qbuttSelector}`);
  }
};
export const expectQueueLength = () => expect(page.evaluate(sel => document.querySelector(`${sel} .elements`).children.length, queueSelector)).resolves;
export const titles = () => page.evaluate(sel => Array.from(document.querySelectorAll(`${sel} .element .title`)).map(n => n.textContent), queueSelector);

const formSelector = '#NebulaApp main form';
let optionsURL: string;
const b = (browser as never as Browser);
declare const chrome: typeof browser;

export const login = async (force = false) => {
  console.log('Using base', __NEBULA_BASE__);

  await page.goto('chrome://settings');
  optionsURL = await page.evaluate(async () => (await chrome.management.getAll())[0].optionsUrl);
  await page.goto(`${__NEBULA_BASE__}/login`);
  await page.bringToFront();
  if (!force && await page.evaluate(() => document.cookie.indexOf('nebula_auth.hasToken=true') >= 0))
    return;

  await expect(page).toFillForm(formSelector, {
    email: __NEBULA_USER__,
    password: __NEBULA_PASS__,
  });
  await expect(page).toClick(`${formSelector} button`, { text: 'Sign in' });
  try {
    await page.waitForResponse('https://users.api.nebula.app/api/v1/authorization/', { timeout: 5000 }); // wait until logged in
  } catch { }
  await setTimeout(1000);
};

export const maybeLogin = (cb: () => Promise<void>) => async () => {
  // Every so often, Nebula logs us out
  // in particular, it seems the combination of reloading the page and clearing localstorage does this
  // even though the cookie appears to still be there
  // happens most often on `ignores completed queue` and `adds proper controls`
  await page.bringToFront();
  await cb();
  if (!await page.$('a[role="button"][href="/join"]'))
    return;
  console.log('Had to login again...', expect.getState().currentTestName);
  await login(true);
  await cb();
};

export const setSettings = async (set: { [key: string]: string | boolean; }) => {
  const pg = await b.newPage();
  await pg.goto(optionsURL);
  const form = await expect(pg).toMatchElement('form');
  const textSet = { ...set };
  for (const key in set) {
    if (typeof (set[key]) !== 'boolean')
      continue;
    // need to check booleans manually
    await form.$eval(`[name="${key}"]`, (el: HTMLInputElement, val: boolean) => el.checked = val, set[key]);
    console.log('Setting', key, 'to', set[key]);
    delete textSet[key];
    await setTimeout(1000);
  }
  await expect(pg).toFillForm('form', textSet, { timeout: 1000 });
  await expect(pg).toClick('button[type="submit"]');
  await setTimeout(100); // wait for saving to finish
  await pg.close();
};
