import { TextEncoder, TextDecoder } from 'util';

// before jsdom v17 (actually whatwg-url v9), this was done automatically
// normally this would work in node v12 and above, but not with jest
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;