/* eslint-disable camelcase */

const manifest: browser._manifest.WebExtensionManifest = {
  manifest_version: 3,
  name: '__MSG_title__',
  description: '__MSG_extensionDescription__',
  version: __VERSION__,
  icons: {
    128: 'icons/icon_128.png',
    64: 'icons/icon_64.png',
  },
  background: {
    service_worker: 'scripts/background_script.js',
  },
  content_scripts: [
    {
      matches: [
        '*://*.nebula.app/*',
        '*://*.nebula.tv/*',
        '*://*.youtube.com/*',
      ],
      js: [
        'scripts/content_script.js',
      ],
      css: [
        'styles/content.css',
      ],
      all_frames: true,
    },
  ],
  web_accessible_resources: [
    {
      resources: ['scripts/player.js'],
      matches: ['*://*.nebula.tv/*'],
    },
    {
      resources: ['scripts/youtube-helpers.js'],
      matches: ['*://*.youtube.com/*'],
    },
  ],
  permissions: [
    'storage',
    'offscreen',
  ],
  host_permissions: [
    // Only firefox requires this, and the subdomain must be completely specified, otherwise the request fails
    '*://content.api.nebula.app/*',
    '*://*.nebula.tv/*',
  ],
  action: {
    default_icon: {
      128: 'icons/icon_128.png',
      64: 'icons/icon_64.png',
    },
    default_title: '__MSG_title__',
  },
  options_ui: {
    page: 'options.html',
    browser_style: true,
  },
  browser_specific_settings: {
    gecko: {
      id: 'nebula-enhancer@piber.at',
    },
  },
  default_locale: 'en',
};
export default manifest;