const paths = require('path').resolve('./extension-dist');

module.exports = {
  launch: {
    headless: false,
    args: [
      `--disable-extensions-except=${paths}`,
      `--load-extension=${paths}`,
    ]
  }
};