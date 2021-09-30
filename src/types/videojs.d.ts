import type videojs from 'video.js';

export type VPlayer = videojs.Player & { _enhancerInit: boolean };
export type VolumePanel = videojs.VolumePanel & { handleMouseOver: (e: MouseEvent) => void, handleMouseOut: (e: MouseEvent) => void }; // incomplete

type ctr<Comp extends videojs.Component = videojs.Component> = {
  prototype: Comp;
  new (player: videojs.Player, options?: videojs.ComponentOptions, ready?: videojs.Component.ReadyCallback): Comp;
};
type extctr<Comp extends ctr> = { [key: string]: any } & Partial<InstanceType<Comp>>;
type thisobj<Comp extends { [key: string]: any }> = {
  [key in keyof Comp]: Comp[key] extends (...args: infer A) => infer R ? (this: Comp, ...args: A) => R : Comp[key];
};
declare namespace v {
  const players: { [key: string]: VPlayer };
  const extend: <B extends ctr, T extends thisobj<extctr<B>>>(base: B, more: T) => {
    prototype: B['prototype'] & T['prototype'];
    new (...a: CtrArgs<B>): InstanceType<B> & T;
  };
}

declare global {
  interface Window {
    videojs: typeof videojs & typeof v;
  }
}