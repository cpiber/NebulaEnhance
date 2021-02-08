import { getBrowserInstance, isAndroid } from "./_shared";

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