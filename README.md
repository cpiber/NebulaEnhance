[English](README.md) / [Deutsch](README.DE.md)


# Enhancer for Nebula

Heavily inspired by [Enhancer for YouTube&trade;](https://www.mrfdev.com/enhancer-for-youtube)

This extension aspires to bring some useful features to the [Nebula](https://watchnebula.com) site. Currently, only features for the player are added.



# Installing

This extension is available on the official add-on stores:

- Firefox: [Get from Mozilla](https://addons.mozilla.org/en-US/firefox/addon/enhancer-for-nebula/)
- Chromium: [soon]

The most recent releases are available [here](https://github.com/cpiber/NebulaEnhance/releases).


# Features

- Default playback speed
- Quick dial to set speed: New button in player allows to increase/decrease speed by scrolling
- Target qualities: Set the preferred video quality or qualities
- Keyboard shortcuts: Shortcuts in video player ([see Playback section](https://www.mrfdev.com/youtube-keyboard-shortcuts))
- Custom scripts: Execute custom JavaScript code in the player's iFrame

More to come. If you have any suggestions, please open a new [issue](https://github.com/cpiber/NebulaEnhance/issues).


# Screenshots

Speed dial:

![Speed dial. Scroll to change speed.](static/Screenshot1.png)

Options page:

![Options.](static/Screenshot2.png)


# Developing

Please make sure you have [NodeJS](https://nodejs.org/) and it's package manager [npm](https://www.npmjs.com/) installed.

- Install dependencies: `npm install`
- Develop: In Firefox `npm run start:firefox` / In Chromium `npm run start:chromium`
- Build: `npm run build`
