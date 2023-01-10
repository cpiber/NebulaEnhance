import { jest } from '@jest/globals';
import { login, maybeLogin, setSettings, videoSelector } from '../shared';

jest.setTimeout(20000);
jest.retryTimes(2);

let somevideo: string;
beforeAll(async () => {
  await login();

  await page.goto(`${__NEBULA_BASE__}/videos`);
  await page.waitForSelector(videoSelector);
  somevideo = await page.evaluate(sel => document.querySelector<HTMLAnchorElement>(sel).href, videoSelector);

  await setSettings({
    playbackChange: '0.5',
    autoplay: true,
    youtube: false,
    volumeEnabled: true,
    customScriptPage: 'document.body.classList.add(\'loaded-from-customScriptPage\')',
  });
}, 15000);

describe('page', () => {
  test('script is run', async () => {
    await page.goto(__NEBULA_BASE__);
    await expect(page).toMatchElement('.loaded-from-customScriptPage', { timeout: 0 });
  });
});

let player: string;
const gotoPlayer = async () => {
  await page.goto(somevideo);
  await page.waitForSelector('.video-js');
  player = await page.$eval('.video-js', el => el.id);
};

// TODO: figure out why the controls aren't added during testing
//       Chrome does not add media codecs with puppeteer, so might be related to that
describe.skip('video player', () => {
  beforeEach(maybeLogin(gotoPlayer));

  test('controls present', async () => {
    await expect(page).toMatchElement('.enhancer-speed', { timeout: 0 });
    await expect(page).toMatchElement('.enhancer-volume', { timeout: 0 });
  });

  test('controls use settings', async () => {
    await page.waitForSelector('.enhancer-speed');
    await expect(page.$eval('.enhancer-tooltip.speed .vjs-nebula-tooltip-label', el => el.textContent)).resolves.toContain('Speed');
    await expect(page.evaluate((p: string) => window.videojs.players[p].autoplay(), player)).resolves.toBe(true);
  });

  test('controls are updated', async () => {
    await page.waitForSelector('.enhancer-speed');

    const speed = await page.evaluate((p: string) => window.videojs.players[p].playbackRate(), player);
    await expect(page.$eval('.enhancer-tooltip.speed .vjs-nebula-tooltip-label', el => el.textContent)).resolves.toContain(`${speed}`);

    const vol = await page.evaluate((p: string) => window.videojs.players[p].volume(), player);
    await expect(page.$eval('.enhancer-volume', el => el.textContent)).resolves.toContain(`${(vol * 100).toFixed(0)}`);
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


