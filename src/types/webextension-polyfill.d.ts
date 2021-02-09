declare module "webextension-polyfill" {
}

declare namespace chrome.storage {
    interface StorageArea {
        get(keys: string | string[] | Object | null): Promise<{ [key: string]: any }>;
        set(items: null): Promise<void>;
    }
}

declare namespace chrome.runtime {
    function getPlatformInfo(): Promise<PlatformInfo>;
    enum PlatformOs { ANDROID = "android" }

    function sendMessage(message: null): Promise<any>;
}