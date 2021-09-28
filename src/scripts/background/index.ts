export * from './misc';
export * from './nebula';
export * from './youtube';

export type Creator = {
  name: string,
  nebula: string,
  channel: string,
  uploads: string,
};
export type Video = {
  title: string,
  videoId: string,
};