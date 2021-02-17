import { getBrowserInstance } from "./_sharedBrowser";

function isAndroid() {
    return getBrowserInstance().runtime.getPlatformInfo().then(information => information.os === 'android');
}

getBrowserInstance().browserAction.onClicked.addListener(async function () {
    const android = await isAndroid();
    // Avoid blank page in firefox android
    // Taken from https://git.synz.io/Synzvato/decentraleyes/-/blob/master/pages/popup/popup.js#L391
    if (android) {
        getBrowserInstance().tabs.create({
            'url': getBrowserInstance().runtime.getURL('options/index.html'),
            'active': true
        });
    } else {
        getBrowserInstance().runtime.openOptionsPage();
    }
});

getBrowserInstance().runtime.onMessage.addListener((message: string | { [key: string]: any }, sender, sendResponse) => {
    if (typeof message === "string") message = { type: message };
    switch (message.type) {
        case "isAndroid":
            return isAndroid();
    }
});