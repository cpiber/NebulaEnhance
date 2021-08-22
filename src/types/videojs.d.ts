import type videojs from 'video.js';

type ctr = new (player: videojs.Player, options?: videojs.ComponentOptions, ready?: videojs.Component.ReadyCallback) => videojs.Component;
export type VPlayer = videojs.Player & { _enhancer_init: boolean };

declare namespace v {
  const players: { [key: string]: VPlayer };
  const extend: <B extends ctr, T extends { [key: string]: any }>(base: B, more: T) => new (...a: CtrArgs<B>) => Instance<B> & T;
}

declare global {
  interface Window {
    videojs: typeof videojs & typeof v;
  }
}