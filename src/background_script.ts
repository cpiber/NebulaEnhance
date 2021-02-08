import { getBrowserInstance } from "./_shared";

getBrowserInstance().browserAction.onClicked.addListener(function () {
    getBrowserInstance().runtime.openOptionsPage();
});