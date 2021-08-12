// @ts-ignore
import type { Browser } from '@types/puppeteer';
import { findAPlayer, getAPlayer } from '../../src/scripts/page/player';
import { videoSelector } from '../shared';

const formSelector = '#NebulaApp > :nth-child(2) > :nth-child(2) form';
let optionsURL: string;
const b = (browser as never as Browser);
declare const chrome: typeof browser;

jest.setTimeout(10000);

let somevideo: string;
beforeAll(async () => {
  console.log('Using base', __NEBULA_BASE__);
  await page.goto('chrome://settings');
  optionsURL = await page.evaluate(async () => (await chrome.management.getAll())[0].optionsUrl);

  await page.goto(`${__NEBULA_BASE__}/login`);
  await expect(page).toFillForm(formSelector, {
    email: __NEBULA_USER__,
    password: __NEBULA_PASS__,
  });
  await expect(page).toClick(`${formSelector} button`, { text: 'Sign In' });
  await page.waitForSelector('[href="/account"]'); // wait until logged in
  await page.goto(`${__NEBULA_BASE__}/videos`);
  await page.waitForSelector(videoSelector);
  somevideo = await page.evaluate(sel => document.querySelector<HTMLAnchorElement>(sel).href, videoSelector);

  await setSettings({
    playbackChange: "0.5",
    autoplay: true,
    youtube: false,
    customScriptPage: "document.body.classList.add('loaded-from-customScriptPage')",
  });
}, 15000);

describe('page', () => {
  test('script is run', async () => {
    await page.goto(__NEBULA_BASE__);
    await expect(page).toMatchElement('.loaded-from-customScriptPage', { timeout: 0 });
  });
});

let player: string;
describe('video player', () => {
  beforeEach(async () => {
    await page.goto(somevideo);
    await page.waitForSelector('.video-js');
    player = await page.$eval('.video-js', el => el.id);
  });

  test('controls present', async () => {
    await expect(page).toMatchElement('.enhancer-speed', { timeout: 0 });
  });

  test('controls use settings', async () => {
    await page.waitForSelector('.enhancer-speed');
    await expect(page.$eval('.enhancer-tooltip .vjs-nebula-tooltip-label', el => el.textContent)).resolves.toContain("Speed");
    await expect(page.evaluate((p: string) => window.videojs.players[p].autoplay(), player)).resolves.toBe(true);
  });
});

describe('video pages 2', () => {
  test('youtube link is loaded', async () => {
    await setSettings({
      youtube: true,
    });

    await page.goto(`${__NEBULA_BASE__}/videos`);
    await page.waitForSelector(videoSelector);

    await page.click(videoSelector);
    await expect(page).toMatchElement('.enhancer-yt, .enhancer-yt-err', { timeout: 0 });

    await setSettings({
      youtube: false,
    });
  });
});

const setSettings = async (set: { [key: string]: string | boolean}) => {
  const pg = await b.newPage();
  await pg.goto(optionsURL);
  const form = await expect(pg).toMatchElement('form');
  for (const key in set) {
    if (typeof(set[key]) !== "boolean")
      continue;
    // need to check booleans manually
    await form.$eval(`[name="${key}"]`, (el: HTMLInputElement, val: boolean) => el.checked = val, set[key]);
    delete set[key];
  }
  await expect(pg).toFillForm('form', set, { timeout: 1000 });
  await expect(pg).toClick('button[type="submit"]');
  await pg.close();
};
