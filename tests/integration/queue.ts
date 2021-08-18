import { addToQueue, expectQueueLength, qbuttSelector, queueSelector, titles, videoSelector } from '../shared';

jest.setTimeout(10000);

beforeAll(async () => {
  await page.goto(__NEBULA_BASE__);
  await page.waitForSelector('.CookieConsent-Button');
  await page.click('.CookieConsent-Button');
});

describe('videos page', () => {
  beforeEach(async () => {
    await page.goto(`${__NEBULA_BASE__}/videos`);
    await page.waitForSelector(videoSelector);
  });

  test('hover video adds queue button', async () => {
    const vid = await page.waitForSelector(videoSelector);
    await (await vid.$('img')).hover();
    await expect(vid).toMatchElement(qbuttSelector);
  });

  test('hover works even after loading new elements', async () => {
    const vid = await page.waitForSelector(videoSelector);
    await (await vid.$('img')).hover();
    await expect(vid).toMatchElement(qbuttSelector);
    
    const cnt = (await page.evaluate(s => document.querySelectorAll(s).length, videoSelector));
    await page.waitForFunction((sel, cnt) => {
      window.scrollBy(0, window.document.body.scrollHeight);
      return document.querySelectorAll(sel).length > cnt;
    }, {}, videoSelector, cnt);
    
    const v2 = await page.waitForSelector(`${videoSelector}:nth-child(${cnt+1})`);
    expect(await page.evaluate(s => document.querySelectorAll(s).length, videoSelector)).toBeGreaterThan(cnt);
    await (await v2.$('img')).hover();
    await expect(v2).toMatchElement(qbuttSelector);
  });

  test('clicking queue button adds video to queue', async () => {
    await page.hover(`${videoSelector} img`);
    await page.click(`${videoSelector} ${qbuttSelector}`);
    await expectQueueLength().toBe(1);
    await page.click(`${videoSelector} ${qbuttSelector}`);
    await expectQueueLength().toBe(1); // don't add another
    const title = await page.evaluate(sel => document.querySelector(`${sel} > :last-child > :nth-child(2)`).textContent, videoSelector);
    await expect(page.evaluate(sel => document.querySelector(`${sel} .element .title`).textContent, queueSelector)).resolves.toEqual(title);

    await page.hover(`${videoSelector}:nth-child(2) img`);
    await page.click(`${videoSelector}:nth-child(2) ${qbuttSelector}`);
    await expectQueueLength().toBe(2);

    expect(
      await page.evaluate(sel =>
        Array.from(document.querySelector(`${sel} .elements`).children)
          .map(e => !e.querySelector('.creator').textContent.match(/.+ • \d+:\d{2}/))
          .reduce((prev, cur) => prev || cur, false), queueSelector),
    ).toBe(false);
  });

  test('can clear queue', async () => {
    await addToQueue(3);
    await expectQueueLength().toBe(3);
    (await expect(page).toDisplayDialog(() => page.click(`${queueSelector} .close`))).dismiss();
    await expectQueueLength().toBe(3);
    (await expect(page).toDisplayDialog(() => page.click(`${queueSelector} .close`))).accept();
    await expectQueueLength().toBe(0);
  });

  test('can remove individual videos', async () => {
    await addToQueue(4);
    await expectQueueLength().toBe(4);
    await expect(page.evaluate(sel => document.querySelector(`${sel} .top .of`).textContent, queueSelector)).resolves.toBe('4');
    // page.click doesn't work, because the element is hidden and hovering first does not help
    await page.evaluate(sel => document.querySelector<HTMLSpanElement>(`${sel} .element:nth-child(2) .r`).click(), queueSelector);
    await expectQueueLength().toBe(3);
    await expect(page.evaluate(sel => document.querySelector(`${sel} .top .of`).textContent, queueSelector)).resolves.toBe('3');
    await page.evaluate(sel => document.querySelector<HTMLSpanElement>(`${sel} .element:nth-child(1) .r`).click(), queueSelector);
    await expectQueueLength().toBe(2);
    await page.evaluate(sel => document.querySelector<HTMLSpanElement>(`${sel} .element:nth-child(2) .r`).click(), queueSelector);
    await expectQueueLength().toBe(1);
    await page.evaluate(sel => document.querySelector<HTMLSpanElement>(`${sel} .element:nth-child(1) .r`).click(), queueSelector);
    await expectQueueLength().toBe(0);
  });

  test('clicking video changes queue top title', async () => {
    await addToQueue(2);
    await page.click(`${queueSelector} .element`);
    const title = await page.evaluate(sel => document.querySelector(`${sel} .element .title`).textContent, queueSelector);
    await page.waitForFunction(title => document.title.indexOf(title) !== -1, { timeout: 1000 }, title);
    await expect(page.url()).toMatch(/videos/);
    await expect(page.title()).resolves.toContain(title);
    await expect(page.evaluate(sel => document.querySelector(`${sel} .top .title`).textContent, queueSelector)).resolves.toBe(title);
    await expect(page.evaluate(sel => document.querySelector(`${sel} .top .no`).textContent, queueSelector)).resolves.toBe('1');
    await page.waitForSelector(`${queueSelector} .element .play`, { visible: true });
  });

  test('navigating works', async () => {
    const correct = async (num: number) => {
      const t = await page.evaluate((sel, num) => document.querySelector(`${sel} .element:nth-child(${num}) .title`).textContent, queueSelector, num);
      await page.waitForFunction(title => document.title.indexOf(title) !== -1, { timeout: 1000 }, t);
      await expect(page.title()).resolves.toContain(t);
      await expect(page.evaluate(sel => document.querySelector(`${sel} .top .title`).textContent, queueSelector)).resolves.toBe(t);
      await expect(page.evaluate(sel => document.querySelector(`${sel} .top .no`).textContent, queueSelector)).resolves.toBe(`${num}`);
    };

    await addToQueue(5);
    await page.evaluate(sel => document.querySelector<HTMLDivElement>(`${sel} .element:nth-child(3)`).click(), queueSelector);
    await correct(3);
    await page.click(`${queueSelector} .top .prev`);
    await correct(2);
    await page.click(`${queueSelector} .top .prev`);
    await correct(1);
    await page.click(`${queueSelector} .top .prev`);
    await correct(1);
    await page.click(`${queueSelector} .top .next`);
    await correct(2);
    await page.click(`${queueSelector} .top .next`);
    await page.click(`${queueSelector} .top .next`);
    await page.click(`${queueSelector} .top .next`);
    await correct(5);
    await page.click(`${queueSelector} .top .next`);
    await correct(5);
  });

  test('reverse queue even', async () => {
    await addToQueue(6);
    const before = await titles();
    await page.click(`${queueSelector} .top .reverse`);
    const after = await titles();
    expect(after).toEqual(before.reverse());
  });

  test('reverse queue odd', async () => {
    await addToQueue(5);
    const before = await titles();
    await page.click(`${queueSelector} .top .reverse`);
    const after = await titles();
    expect(after).toEqual(before.reverse());
  });

  test('sharing produces url that restores queue', async () => {
    await addToQueue(3);
    await page.click(`${queueSelector} .top .share`);
    const url = await page.evaluate(() => document.querySelector<HTMLInputElement>('.enhancer-queue-share input[type="text"]').value);
    const before = await titles();
    await page.goto(url);
    await page.waitForSelector(queueSelector);
    await page.waitForFunction(sel => document.querySelectorAll(`${sel} .element`).length > 0, {}, queueSelector);
    await expect(titles()).resolves.toEqual(before);
  });
});
