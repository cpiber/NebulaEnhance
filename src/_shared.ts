
export function getBrowserInstance(): typeof chrome {
    // Get extension api Chrome or Firefox
    // @ts-ignore
    const browserInstance = window.chrome || (window as any)['browser'] || browser;
    return browserInstance;
}

export function isAndroid() {
    return new Promise<boolean>((resolve, reject) => {
        getBrowserInstance().runtime.getPlatformInfo(function (information) {
            console.log(information);
            // @ts-ignore
            resolve(information.os === chrome.runtime.PlatformOs.ANDROID);
        });
    });
}