declare module "*.svg" {
    const content: string;
    export default content;
}

declare module "webextension-polyfill" {
    const b: typeof browser;
    export default b;
}