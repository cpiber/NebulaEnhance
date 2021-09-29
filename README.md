<!-- LTeX: language=en-US -->

[English](README.md) / [Deutsch](README.DE.md)

[![Build + Test](https://badgen.net/github/checks/cpiber/NebulaEnhance/?label=build)](https://github.com/cpiber/NebulaEnhance/actions/)
[![Dependencies](https://badgen.net/david/dep/cpiber/NebulaEnhance/)](https://david-dm.org/cpiber/NebulaEnhance)
[![DevDependencies](https://badgen.net/david/dev/cpiber/NebulaEnhance/)](https://david-dm.org/cpiber/NebulaEnhance?type=dev)
[![codecov](https://badgen.net/codecov/c/github/cpiber/NebulaEnhance)](https://codecov.io/gh/cpiber/NebulaEnhance)


# Enhancer for Nebula

Heavily inspired by [Enhancer for YouTube&trade;](https://www.mrfdev.com/enhancer-for-youtube)

This extension aspires to bring some useful features to the [Nebula](https://nebula.app) site.



# Installing

This extension is available on the official add-on stores:

- Firefox: [![amo](https://badgen.net/amo/v/enhancer-for-nebula)](https://addons.mozilla.org/en-US/firefox/addon/enhancer-for-nebula/) 
- Chromium: [![chrome](https://badgen.net/chrome-web-store/v/niaholaehmipmbpoagjmdlocnhakeonl)](https://chrome.google.com/webstore/detail/enhancer-for-nebula/niaholaehmipmbpoagjmdlocnhakeonl)

The most recent releases are available [here](https://github.com/cpiber/NebulaEnhance/releases).

Please be aware that both Mozilla and Google need to verify my changes before making them visible in the stores. Especially for the Chrome Webstore this takes time.


# Features

**Page**
- Queue: Add videos to watch queue
- Share: Queue is shareable -- Bookmark and Share your list!
- YouTube Link: This extension can try to find the corresponding YouTube video (enable in settings)
- Watch on Nebula: On any YouTube video page tries to find the corresponding Nebula video (enable in settings)
- ~~Theatre Mode: Make the player fit the page better~~ Now natively supported

**Player**
- Quick dial to set speed: New button in player to increase/decrease speed by scrolling
- Scroll over player to set volume (enable in settings)
- Toggle time display between current/remaining time
- Autoplay: Start videos automatically
- Keyboard shortcuts: Shortcuts in video player ([see Playback section](https://www.mrfdev.com/youtube-keyboard-shortcuts))
- ~~Default playback speed and volume, subtitles~~ Now natively supported
- ~~Target qualities: Set the preferred video quality or qualities~~ Now natively supported

**Custom scripts**
- Execute custom JavaScript code on the web page

If you have any suggestions, please open a new [issue](https://github.com/cpiber/NebulaEnhance/issues) or start a [discussion](https://github.com/cpiber/NebulaEnhance/discussions/new).


# Screenshots

Queue:

![Queue / Watch list.](static/Screenshot3_dark.png)

Player with new controls (Queue next/previous, volume indicator, time remaining, quick dial):

![Player with controls.](static/Screenshot1.png)


# Developing

See [DEVELOPING.md](DEVELOPING.md)