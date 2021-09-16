export * from './communication';
export * from './constants';
export * from './helpers';

export type ytvideo = {
  confidence: number,
  video: string,
};

export type nebulavideo = {
  link: string,
} & ({
  is: 'video' | 'search',
  confidence: number,
} | {
  is: 'channel',
});