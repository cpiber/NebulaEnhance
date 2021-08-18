import type videojs from 'video.js';

type ctr = new (player: videojs.Player, options?: videojs.ComponentOptions, ready?: videojs.Component.ReadyCallback) => videojs.Component;

declare namespace v {
  const players: { [key: string]: videojs.Player };
  const extend: <T extends { [key: string]: any }>(base: ctr, more: T) => ctr & T;
}

declare global {
  interface Window {
    videojs: typeof videojs & typeof v;
  }
}