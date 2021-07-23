import type { VideoJsPlayer } from "video.js";
import type videojs from "video.js";

type ctr = new (player: VideoJsPlayer, options?: videojs.ComponentOptions, ready?: videojs.Component.ReadyCallback) => videojs.Component;

declare namespace v {
  const players: { [key: string]: VideoJsPlayer };
  const extend: (base: ctr, more: { [key: string]: any }) => ctr;
}

declare global {
  interface Window {
    videojs: typeof videojs & typeof v;
  }
}