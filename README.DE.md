[English](README.md) / [Deutsch](README.DE.md)


# Enhancer for Nebula

Stark inspiriert von [Enhancer for YouTube&trade;](https://www.mrfdev.com/enhancer-for-youtube)

Diese Erweiterung will nützliche Features zur Nebula Seite bringen. Im Moment werden nur Änderungen am Videospieler ausgeführt.


# Installierung

Die Erweiterung ist verfügbar in den offiziellen add-on stores:

- Firefox: [soon]
- Chromium: [soon]

Die neuesten Veröffentlichungen sind [hier](https://github.com/cpiber/NebulaEnhance/releases) verfügbar.


# Features

- Standard Abspielgeschwindigkeit: Erlaubt es, standardmäßig Videos mit anderer Geschwindigkeit abzuspielen
- "Quick dial" für Abspielgeschwindigkeit: Ein neuer Knopf im Videospieler erlaubt es per Mausrad die Geschwindigkeit bequem und schnell zu verändern
- Zielqualitäten: Erlaubt es, bevorzugte Videoqualität(en) zu setzen

Mehr in Planung. Falls Sie Vorschläge haben, öffnen Sie bitte eine neue [issue](https://github.com/cpiber/NebulaEnhance/issues).


# Screenshots

Speed dial:

![Speed dial. Scroll to change speed.](static/Screenshot1.png)

Optionen Seite:

![Options.](static/Screenshot2_de.png)


# Entwickeln

Stellen Sie bitte sicher, dass Sie [NodeJS](https://nodejs.org/) und dessen package manager [npm](https://www.npmjs.com/) installiert haben.

- Abhängigkeiten installieren: `npm install`
- Entwickeln: In Firefox `npm run start:firefox` / In Chromium `npm run start:chromium`
- Builden: `npm run build`
