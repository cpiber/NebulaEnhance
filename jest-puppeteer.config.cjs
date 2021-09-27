/* eslint sort-keys: ['error'] */

const paths = require('path').resolve('./extension-dist');

module.exports = {
  launch: {
    args: [
      `--disable-extensions-except=${paths}`,
      `--load-extension=${paths}`,
      '--disable-features=site-per-process', // we need this because otherwise the player's iframe gets detached
    ],
    headless: false,
  },
};