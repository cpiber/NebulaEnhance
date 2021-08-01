// @ts-ignore
import type { Browser, ElementHandle, Frame } from '@types/puppeteer';
import { addToQueue, queueSelector, videoSelector } from '../shared';

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
    playbackRate: "1.5",
    playbackChange: "0.5",
    volume: "0.5",
    autoplay: true,
    targetQualities: "",
    subtitles: "",
    theatre: false,
    youtube: false,
    customScript: "document.body.classList.add('loaded-from-customScript')",
    customScriptPage: "document.body.classList.add('loaded-from-customScriptPage')",
  });
}, 15000);

let iframe: ElementHandle<HTMLIFrameElement>;
let frame: Frame;
const waitForFrame = async (url = somevideo) => {
  if (url) await page.goto(url);
  iframe = await page.waitForSelector('iframe');
  frame = await iframe.contentFrame();
};

describe('page', () => {
  test('script is run', async () => {
    await page.goto(__NEBULA_BASE__);
    await expect(page).toMatchElement('.loaded-from-customScriptPage', { timeout: 0 });
  });
});

describe('video player', () => {
  beforeEach(() => waitForFrame());

  test('controls present', async () => {
    await expect(frame).toMatchElement('.enhancer-speed', { timeout: 0 });
    await expect(frame).toMatchElement('.enhancer-theatre', { timeout: 0 });
  });

  test('controls use settings', async () => {
    const speed = await frame.waitForSelector('.enhancer-speed');
    const text = await speed.evaluate(el => el.querySelector('.theo-button-tooltip').textContent);
    expect(text).toContain("1.5");
    await expect(frame.evaluate(() => window.theoplayer.playbackRate)).resolves.toBe(1.5);
    await expect(frame.evaluate(() => window.theoplayer.volume)).resolves.toBe(0.5);
    await expect(frame.evaluate(() => window.theoplayer.autoplay)).resolves.toBe(true);
  });

  test('script is run', async () => {
    await expect(frame).toMatchElement('.loaded-from-customScript', { timeout: 0 });
  });

  test('theatre mode sets size', async () => {
    const wrapper = await page.waitForSelector('[id^="zype_"]');
    await frame.waitForSelector('.enhancer-theatre');
    await expect(wrapper.evaluate((el: HTMLElement) => el.style.height)).resolves.toEqual('');
    await frame.$eval('.enhancer-theatre', (el: HTMLElement) => el.click());
    await expect(wrapper.evaluate((el: HTMLElement) => el.style.height)).resolves.not.toEqual('');
  });

  test('theatre mode can be enabled by default', async () => {
    // note that if this test fails, it could also influence other tests (that expect theatre mode to be off)
    await setSettings({
      theatre: true,
    });
    await waitForFrame();

    const wrapper = await page.waitForSelector('[id^="zype_"]');
    await frame.waitForSelector('.enhancer-theatre');
    await page.waitForFunction((el: HTMLElement) => !!el.style.height, { timeout: 1000 }, wrapper);
    await expect(wrapper.evaluate((el: HTMLElement) => el.style.height)).resolves.not.toEqual('');

    await setSettings({
      theatre: false,
    });
    await waitForFrame();

    const wrapper2 = await page.waitForSelector('[id^="zype_"]');
    await frame.waitForSelector('.enhancer-theatre');
    await page.waitForFunction((el: HTMLElement) => !el.style.height, { timeout: 1000 }, wrapper2);
    await expect(wrapper2.evaluate((el: HTMLElement) => el.style.height)).resolves.toEqual('');
  });
});

describe('video pages 2', () => {
  test('preferences are retained', async () => {
    await page.goto(`${__NEBULA_BASE__}/videos`);
    await page.waitForSelector(videoSelector);
    await addToQueue(2);

    await page.click(`${queueSelector} .element`);
    await waitForFrame(null);
    await frame.waitForSelector('.enhancer-theatre');
    await frame.$eval('.enhancer-theatre', (el: HTMLElement) => el.click());
    await frame.evaluate(() => {
      window.theoplayer.playbackRate = 2;
      window.theoplayer.volume = 0.8;
    });

    await page.click(`${queueSelector} .element:nth-child(2)`);
    await waitForFrame(null);
    await frame.waitForSelector('.enhancer-theatre');
    const wrapper = await page.waitForSelector('[id^="zype_"]');
    await page.waitForFunction((el: HTMLElement) => !!el.style.height, { timeout: 1000 }, wrapper);
    await expect(wrapper.evaluate((el: HTMLElement) => el.style.height)).resolves.not.toEqual('');
    await expect(frame.evaluate(() => window.theoplayer.playbackRate)).resolves.toBe(2);
    await expect(frame.evaluate(() => window.theoplayer.volume)).resolves.toBe(0.8);
  });

  test('youtube link is loaded', async () => {
    await setSettings({
      youtube: true,
    });

    await page.goto(`${__NEBULA_BASE__}/videos`);
    await page.waitForSelector(videoSelector);

    await page.click(videoSelector);
    await expect(page).toMatchElement('.enhancer-yt, .enhancer-yt-err', { timeout: 0 });

    await setSettings({
      youtube: true,
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
