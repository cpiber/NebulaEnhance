const path = require('path');

const transform = {
  "\\.[tj]s$": [ 'rollup-jest', { useCache: false, resolveImports: process.env.RESOLVE, args: { configType: "tests-internal", silent: true }, configFile: "./rollup.config.js" } ],
};
const moduleNameMapper = {
  "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|sass|scss|css)$": "<rootDir>/tests/__mocks__/fileMock.js",
};

module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        path.resolve("./tests/unit/**/*.ts")
      ],
      transform,
      moduleNameMapper,
      testEnvironment: "jsdom",
    },
    {
      displayName: 'integration',
      preset: 'jest-puppeteer',
      testMatch: [
        path.resolve("./tests/integration/**/*.ts")
      ],
      moduleNameMapper,
      transform,
    },
  ],
};