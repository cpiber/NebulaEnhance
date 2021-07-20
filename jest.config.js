const path = require('path');

const transform = {
  ".": [ 'rollup-jest', { useCache: false, resolveImports: !process.env.COVERAGE, args: { configType: "tests-internal", silent: true }, configFile: "./rollup.config.js" } ],
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