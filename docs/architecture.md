# Architecture

To ensure a proper understanding of what methods are available where, this document presents an overview of the architecture of the extension.
This can be skipped if you are only interested in the presented methods.

---

The WebExtension format (which all new extensions for Firefox and Chromium are built on) enforces a few security considerations, which Enhancer for Nebula is built around.

The extension can be loosely separated into three parts:
- *[background](../src/scripts/background_script.ts)*: This part is always loaded in the browser background. It has access to all browser apis (that were requested in manifest). Enhancer uses this part to handle cross-tab tasks like searching for a video.
- *[content](../src/scripts/content_script.ts)*: The content script is added to all Nebula and YouTube tabs (as specified in manifest), and has access to most browser apis. Each tab has its own instance of the script. Since it runs in the tab, it can access the content and is thus responsible for most interactions.
- *[player](../src/scripts/player.ts)*: The player script is not formally part of WebExtensions. Enhancer injects this script itself into every Nebula tab. It is part of the page proper (as if it was loaded by Nebula) and has no access to the browser apis. In exchange, it has access to *all* content apis, which are restricted for the content script due to security reasons. This script is responsible for adding controls to the player and detecting navigation.

These three layers directly mandate the [slightly complex communication implemented](../src/scripts/helpers/shared/communication.ts), documented in [Messages](messages.md) and [Events](events.md).
<br />

Some technical information:
- Content scripts are not allowed to modify any properties on `window` or access non-standard DOM properties.
- Player/Content communication is handled via `window.postMessage`.
- Content/Background communication is handled via `browser.runtime.sendMessage`.