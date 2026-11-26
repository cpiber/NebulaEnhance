
export type video = {
  length: string,
  thumbnail: string,
  title: string,
  creator: string,
};

export type Store = { [key: string]: video; };