// @ts-ignore
import type { ElementHandle, Frame, Browser } from '@types/puppeteer';

const formSelector = '#NebulaApp > :nth-child(2) > :nth-child(2) form';
const videoSelector = 'a[href^="/videos/"]';
let optionsURL: string;
const b = (browser as never as Browser);
declare const chrome: typeof browser;

jest.setTimeout(10000);

let somevideo: string;
beforeAll(async () => {
  await page.goto('chrome://settings');
  optionsURL = await page.evaluate(async () => (await chrome.management.getAll())[0].optionsUrl);

  await page.setViewport({ width: 1100, height: 600 });
  await page.goto('https://nebula.app/');
  await expect(page).toClick('button', { text: 'Sign In' });
  await expect(page).toFillForm(formSelector, {
    email: __NEBULA_USER__,
    password: __NEBULA_PASS__,
  });
  await expect(page).toClick(`${formSelector} button`, { text: 'Sign In' });
  await page.goto('https://nebula.app/videos');
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
});

let iframe: ElementHandle<HTMLIFrameElement>;
let frame: Frame;
const waitForFrame = async (url = somevideo) => {
  await page.goto(url);
  iframe = await page.waitForSelector('iframe');
  frame = await iframe.contentFrame();
};

describe('video page', () => {
  beforeEach(async () => {
    await page.goto(somevideo);
  });

  test('script is run', async () => {
    await page.goto('https://nebula.app/');
    await page.waitForSelector('.loaded-from-customScriptPage');
  });
});

describe('video player', () => {
  beforeEach(async () => await waitForFrame());

  test('controls present', async () => {
    await frame.waitForSelector('button.enhancer-speed');
    await frame.waitForSelector('button.enhancer-theatre');
  });

  test('controls use settings', async () => {
    const speed = await frame.waitForSelector('button.enhancer-speed');
    const text = await speed.evaluate(el => el.querySelector('.theo-button-tooltip').textContent);
    expect(text).toContain("1.5");
    await expect(frame.evaluate(() => window.theoplayer.playbackRate)).resolves.toBe(1.5);
    await expect(frame.evaluate(() => window.theoplayer.volume)).resolves.toBe(0.5);
    await expect(frame.evaluate(() => window.theoplayer.autoplay)).resolves.toBe(true);
  });

  test('script is run', async () => {
    await frame.waitForSelector('.loaded-from-customScript');
  });

  test('theatre mode sets size', async () => {
    const wrapper = await page.waitForSelector('[id^="zype_"]');
    await frame.waitForSelector('button.enhancer-theatre');
    await expect(wrapper.evaluate((el: HTMLElement) => el.style.height)).resolves.toEqual('');
    await frame.$eval('button.enhancer-theatre', (el: HTMLElement) => el.click());
    await expect(wrapper.evaluate((el: HTMLElement) => el.style.height)).resolves.not.toEqual('');
  });

  test('theatre mode can be enabled by default', async () => {
    await setSettings({
      theatre: true,
    });
    await waitForFrame();

    const wrapper = await page.waitForSelector('[id^="zype_"]');
    await frame.waitForSelector('button.enhancer-theatre');
    await page.waitForFunction((el: HTMLElement) => !!el.style.height, { timeout: 1000 }, wrapper);
    await expect(wrapper.evaluate((el: HTMLElement) => el.style.height)).resolves.not.toEqual('');

    await setSettings({
      theatre: false,
    });
    await waitForFrame();

    const wrapper2 = await page.waitForSelector('[id^="zype_"]');
    await frame.waitForSelector('button.enhancer-theatre');
    await page.waitForFunction((el: HTMLElement) => !el.style.height, { timeout: 1000 }, wrapper2);
    await expect(wrapper2.evaluate((el: HTMLElement) => el.style.height)).resolves.toEqual('');
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
