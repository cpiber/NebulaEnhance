import type { knownPages, loadPrefix, navigatePrefix } from '../scripts/page/dispatcher';

type prefixes = typeof navigatePrefix | typeof loadPrefix;

declare global {
  type FnArgs<F> = F extends (this: any, ...args: infer R) => any ? R : never;
  type CtrArgs<F> = F extends new (...args: infer R) => any ? R : never;
  
  type NavigateOrLoadEvent<K extends string, D extends { [key: string]: any } = { [key: string]: any }> = CustomEvent<{ page: K, from: string } & D>;
  type PageEvent<K extends string> = NavigateOrLoadEvent<K, { more: string | undefined }>;
  type VideoEvent = NavigateOrLoadEvent<'video', { video: string }>;
  type HomeEvent = NavigateOrLoadEvent<'home'>;
  type CreatorEvent = NavigateOrLoadEvent<'creator', { who: string, more: string | undefined }>;
  interface Document {
    addEventListener<K extends typeof knownPages[number], P extends prefixes>(type: `${P}-${K}`, listener: (this: Document, ev: PageEvent<K>) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener<P extends prefixes>(type: `${P}-video`, listener: (this: Document, ev: VideoEvent) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener<P extends prefixes>(type: `${P}-home`, listener: (this: Document, ev: HomeEvent) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener<P extends prefixes>(type: `${P}-creator`, listener: (this: Document, ev: CreatorEvent) => any, options?: boolean | AddEventListenerOptions): void;
  }
}