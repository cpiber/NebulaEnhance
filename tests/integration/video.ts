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
  // this test only works on MV2, so skip it for now
  test.skip('script is run', async () => {
    await page.goto(__NEBULA_BASE__);
    await expect(page).toMatchElement('.loaded-from-customScriptPage', { timeout: 0 });
  });
});

const gotoPlayer = async () => {
  await page.goto(somevideo);
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
  });

  test.todo('controls are updated');
});

describe.skip('video pages 2', () => { // skip this test, since at the moment enabling YouTube setting does not seem to apply
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


