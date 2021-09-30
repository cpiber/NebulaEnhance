# Quick Start

Please make sure you have [NodeJS](https://nodejs.org/) and it's package manager [npm](https://www.npmjs.com/) installed.

- Install [pnpm](https://github.com/pnpm/pnpm): `npm install -g pnpm`
- Install dependencies: `pnpm install`
- Develop: In Firefox `npm run start:firefox` / In Chromium `npm run start:chromium`
  - Alternatively you can also run `npm run start` and `npm run ext:firefox` / `npm run ext:chromium` in different terminals to separate the building and reloading of the extension
- Build: `npm run build`

## Node versions:

- Building: Min. tested version is `node v12` (v12.22.6) (pnpm needs `>=12.17`), but doesn't run tests properly (unit tests fail)
- Full: Min tested version is `node v14` (tested w/ v14.18.0, v15.14.0, v16.10.0)


# Coding

All source files are written in TypeScript, a superset of JavaScript. This enables strict type checking and usage of ESNext features. All new code is expected to be in TypeScript with proper annotations.

There is no coding standard, but the current code is written with an indentation of 2 spaces, brackets on same line. ESLint enforces the current style loosely.

If you want to add a feature, please open a new issue first to discuss.

All new code must be covered by tests (exceptions can be discussed).


# Logging to the console

There are currently two ways to log to the console:
- Using regular `console` (e.g. `console.log`): Anything other than `console.debug` should be avoided to avoid filling the user's console with irrelevant content. `debug` denotes messages that can be helpful in debugging issues. `error` and `warn` can be used to show unexpected behavior (use sparingly).
- Using `console.dev` (e.g. `console.dev.log`): These calls are directly translated to their `console` counterparts in development mode, and patched out in production. These can be used to output interval information that can be helpful e.g. in retrace program execution, but not for debugging errors. *Do not put actual computations as arguments to allow clean patching*.


# In depth

First, please make sure you are set up as outlined above: NodeJS, npm and pnpm have to be installed.

There are a lot of scripts, you can see all of them in the [`package.json`](package.json) file. Scripts are started with `npm run <script>`, where `<script>` is the name, e.g. `npm run build`.

The source code of the extension is in the folder `src` (structure see below). The tests are in the folder `tests`.

&nbsp;

Some available scripts:

- `build`. This builds and tests the whole extension. You can find the bundled zip in the folder `web-ext-artifacts`.
- `start`. This command watches and re-builds all extension-related files in debug mode, i.e. when a file of the extension changes, all files that depend on it are recompiled. You can find the built (but not bundled) extension in the folder `extension-dist`.
- `start:firefox`/`start:chromium`. Like above, but also starts the selected browser with the extension loaded. In Firefox, the extension is automatically reloaded on build (sometimes you have to save twice to get the most up-to-date version), in Chrome you have to manually update it (Manage Extensions > Developer Mode on > Update). The commands `ext:firefox`/`ext:chromium` only start the browser (no build).
- `test`. Compile and run all tests (unit and integration).
- `test:unit`/`test:ee`. Run unit/integration tests.
- `clean`. Clean up all build artifacts (bundles are not affected).
- `lint`. Lint entire code. Includes js, css and built extension (AMO).
- `lint-fix`. Lint entire code as above and fix fixable issues.

For more control over the build process, it is recommended to use `npm run start` to run the build, and `npm run ext:<browser>` in a separate terminal. This allows to restart either process independently, as well as test in both browsers without halting the build.

The commands `ext:android` and `start:android` can be used for development on Firefox Android.

For both `ext:firefox` and `ext:android` you can specify a Firefox profile if you'd like to keep all changes. **WARNING**: This option makes the profile specified by `--firefox-profile` completely insecure for daily use (see [the docs](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#--firefox)). If you'd like to go ahead, run `npm run ext:firefox -- --keep-profile-changes -p <profile name>`.


# Folder structure

```
NebulaEnhance
 ├── .env -- Env file. Do not commit.
 ├── .env.sample -- Env file example.
 ├── .eslintrc.js -- ESLint (js linter) config file.
 ├─> .github
 │   └─> workflows
 ├── .gitignore
 ├── .stylelintrc.js -- StyleLint (css linter) config file.
 ├── DEVELOPING.md
 ├── README.DE.md
 ├── README.md
 ├─> extension-dist (generated) -- Built extension.
 ├── jest-puppeteer.config.js -- Jest-Puppeteer (integration testrunner) config.
 ├── jest.config.js -- Jest (testrunner) config.
 ├── jest.setup.js -- Jest setup file, run before each test file.
 ├─> node_modules (generated) -- Installed packages.
 ├── package.json -- Package definition.
 ├── pnpm-lock.yaml -- Installed packages lock file.
 ├── rollup.config.js -- Rollup (build tool) config.
 ├─> src
 │   ├─> _locales -- Locale files (see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization)
 │   ├─> icons -- Icon files.
 │   ├── manifest.ts -- Compiles to manifest.json.
 │   ├─> options -- Assets for options page.
 │   ├─> scripts -- All scripts bundled in the extension proper. Top level files are entry points.
 │   │   ├─> content -- Code relevant for nebula page.
 │   │   ├─> helpers -- Shared code.
 │   │   ├─> options -- Code for options page.
 │   │   └─> page -- Code to be injected into page.
 │   ├─> styles -- Stylesheets. Top level files are entry points.
 │   └─> types -- Typescript type declarations.
 ├─> static -- Static content, github only. Not relevant for extension.
 ├─> tests
 │   ├─> fixtures -- External files to be used during tests instead of actual content
 │   ├─> integration -- Integration tests
 │   ├─> mocks -- Module mocks
 │   └─> unit -- Unit tests
 ├── tsconfig.js -- Typescript config.
 ├── tsconfig.prod.js -- Typescript config for production build.
 └─> web-ext-artifacts (generated) -- The bundled extension will be placed here.
```

The `.env` file is a local file where you can store sensitive information. Its contents are loaded into the environment before building. The YouTube API key (and the Nebula username+password for integration tests) are taken from this environment. `.env.sample` shows how a `.env` file should be structured.