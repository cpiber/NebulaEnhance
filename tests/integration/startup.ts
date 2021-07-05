describe('videos page', () => {
  beforeAll(async () => {
    await page.goto('https://nebula.app/videos');
  });

  test('hover video adds queue button', async () => {
    await page.waitForSelector('a[href^="/videos/"] img');
    await page.hover('a[href^="/videos/"] img');
    await expect(page).toMatchElement('.enhancer-queueButton');
  });
});
