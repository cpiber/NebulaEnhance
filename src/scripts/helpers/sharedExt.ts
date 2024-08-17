import browser from 'webextension-polyfill';
import type { CreatorSettings } from '../content/nebula/creator-settings';
import { parseTimeString as _parseTimeString, notification } from './shared';
import './shared/prototype';
export * from './shared';

export const getBrowserInstance = () => browser; // poly-filled
export const isChrome = () => (globalThis as any).chrome !== undefined;

export function getFromStorage<T extends { [key: string]: any; }>(key: T): Promise<T>;
export function getFromStorage<T>(key?: string | string[] | null): Promise<T>;
export function getFromStorage<T>(key?: string | string[] | { [key: string]: any; } | null) {
  const { sync, local } = browser.storage;
  return (sync || local).get(key) as Promise<T>;
}
export function setToStorage(key: { [key: string]: any; }) {
  const { sync, local } = browser.storage;
  return (sync || local).set(key);
}

const hidingCreator = browser.i18n.getMessage('pageHidingCreator');
const showingCreator = browser.i18n.getMessage('pageShowingCreator');
const hidingCreatorPlus = browser.i18n.getMessage('pageHidingCreatorPlus');
const showingCreatorPlus = browser.i18n.getMessage('pageShowingCreatorPlus');
const localeTimeMappings = browser.i18n.getMessage('miscTimeLocaleMappings');
const invalidElements = browser.i18n.getMessage('miscTimeInvalidElements');

export const toggleHideCreator = async (creator: string, hide: boolean) => {
  // let's hope we don't get interrupted here, could lose data, but no way to lock...
  const { creatorSettings } = await getFromStorage({ creatorSettings: {} as Record<string, CreatorSettings> });
  if (!(creator in creatorSettings)) creatorSettings[creator] = {};
  creatorSettings[creator].hideCompletely = hide;
  console.debug(hide ? 'Hiding creator' : 'Showing creator', creator);
  notification(hide ? hidingCreator : showingCreator);
  trimCreatorSettings(creatorSettings);
  await setToStorage({ creatorSettings });
  return creatorSettings;
};

export const toggleHideCreatorPlus = async (creator: string, hide: boolean) => {
  // let's hope we don't get interrupted here, could lose data, but no way to lock...
  const { creatorSettings } = await getFromStorage({ creatorSettings: {} as Record<string, CreatorSettings> });
  if (!(creator in creatorSettings)) creatorSettings[creator] = {};
  creatorSettings[creator].hidePlus = hide;
  console.debug(hide ? 'Hiding plus content for creator' : 'Showing plus content for creator', creator);
  notification(hide ? hidingCreatorPlus : showingCreatorPlus);
  trimCreatorSettings(creatorSettings);
  await setToStorage({ creatorSettings });
  return creatorSettings;
};

export const setCreatorHideAfter = async (creator: string, hideAfter: string) => {
  // let's hope we don't get interrupted here, could lose data, but no way to lock...
  const { creatorSettings } = await getFromStorage({ creatorSettings: {} as Record<string, CreatorSettings> });
  if (!(creator in creatorSettings)) creatorSettings[creator] = {};
  hideAfter = hideAfter.trim();
  creatorSettings[creator].hideAfter = hideAfter !== '' ? hideAfter : undefined;
  trimCreatorSettings(creatorSettings);
  await setToStorage({ creatorSettings });
  return creatorSettings;
};

export const setCreatorHideLonger = async (creator: string, hideLonger: string) => {
  // let's hope we don't get interrupted here, could lose data, but no way to lock...
  const { creatorSettings } = await getFromStorage({ creatorSettings: {} as Record<string, CreatorSettings> });
  if (!(creator in creatorSettings)) creatorSettings[creator] = {};
  hideLonger = hideLonger.trim();
  creatorSettings[creator].hideIfLonger = hideLonger !== '' ? hideLonger : undefined;
  trimCreatorSettings(creatorSettings);
  await setToStorage({ creatorSettings });
  return creatorSettings;
};

const trimCreatorSettings = (creatorSettings: Record<string, CreatorSettings>) => {
  for (const prop in creatorSettings) {
    if (!creatorSettings[prop].hideCompletely) delete creatorSettings[prop].hideCompletely;
    if (!creatorSettings[prop].hideAfter) delete creatorSettings[prop].hideAfter;
    if (!creatorSettings[prop].hideIfLonger) delete creatorSettings[prop].hideIfLonger;
    if (!creatorSettings[prop].hidePlus) delete creatorSettings[prop].hidePlus;
    if (!Object.keys(creatorSettings[prop]).length) delete creatorSettings[prop];
  }
};

export const uploadIsBefore = (upload: number, seconds: number | string) => {
  if (typeof seconds === 'string') seconds = parseTimeString(seconds);
  const before = Date.now() - seconds * 1000;
  return upload < before;
};

export const uploadIsLongerThan = (duration: number, seconds: number | string) => {
  if (typeof seconds === 'string') seconds = parseTimeString(seconds);
  return duration > seconds;
};

export const parseTimeString = (str: string): number => _parseTimeString(str, invalidElements, localeTimeMappings, unit => browser.i18n.getMessage('miscTimeInvalidUnit', unit));