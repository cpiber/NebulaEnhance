import { getBrowserInstance } from '../helpers/sharedExt';
import { getInformation } from '../page/offscreen';
import type { Creator } from './index';

let creating: Promise<void> | undefined = undefined;
async function setupOffscreenDocument(path: string) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = getBrowserInstance().runtime.getURL(path);
  // @ts-expect-error offscreen API not typed
  const existingContexts = await getBrowserInstance().runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    // @ts-expect-error offscreen API not typed
    creating = getBrowserInstance().offscreen.createDocument({
      url: path,
      reasons: ['DOM_PARSER'],
      justification: 'needed for scraping the nebula creator page',
    });
    await creating;
    creating = null;
  }
}
async function closeOffscreenDocument() {
  // @ts-expect-error offscreen API not typed
  await getBrowserInstance().offscreen.closeDocument();
}

export const loadCreators: () => Promise<Creator[]> = (() => {
  if (__MV3__) {
    console.info('MV3! Using offscreen API instead');
    return async () => {
      await setupOffscreenDocument('offscreen.html');
      const data: Creator[] = await getBrowserInstance().runtime.sendMessage({
        type: 'getCreatorInformation',
        target: 'offscreen',
      });
      await closeOffscreenDocument();
      console.dev.log('Creator data:', data);
      return data;
    };
  }

  return getInformation;
})();

// @ts-expect-error regex works, don't touch
export const normalizeString = (str: string) => str.toLowerCase().normalize('NFD').replace(/\p{Pd}/g, '-')
  /* eslint-disable-next-line no-misleading-character-class */
  .replace(/["'()[\]{}\u0300-\u036f]/g, '');
