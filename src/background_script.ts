import { getBrowserInstance } from "./_shared";

function isAndroid() {
    return new Promise<boolean>((resolve, reject) => {
        getBrowserInstance().runtime.getPlatformInfo(function (information) {
            console.debug(information);
            // @ts-ignore
            resolve(information.os === chrome.runtime.PlatformOs.ANDROID);
        });
    });
}

getBrowserInstance().browserAction.onClicked.addListener(async function () {
    const android = await isAndroid();
    if (android) {
        getBrowserInstance().tabs.create({
            'url': chrome.runtime.getURL('options/index.html'),
            'active': true
        });
    } else {
        getBrowserInstance().runtime.openOptionsPage();
    }
});

getBrowserInstance().runtime.onMessage.addListener(async (message: string | { [key: string]: any }, sender, sendResponse) => {
    if (typeof message === "string") message = { type: message };
    switch (message.type) {
        case "isAndroid":
            const android = await isAndroid();
            sendResponse({ response: android });
            return android;
    }
});