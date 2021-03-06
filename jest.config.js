const path = require('path');

const transform = {
  ".": [ 'rollup-jest', { useCache: false, args: { configType: "tests-internal", silent: true, resolve: !process.env.COVERAGE }, configFile: "./rollup.config.js" } ],
};

module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        path.resolve("./tests/unit/**/*.ts")
      ],
      transform,
      testEnvironment: "jsdom",
    },
    {
      displayName: 'integration',
      preset: 'jest-puppeteer',
      testMatch: [
        path.resolve("./tests/integration/**/*.ts")
      ],
      transform,
    },
  ],
};