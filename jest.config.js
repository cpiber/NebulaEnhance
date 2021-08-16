const transform = {
  "\\.[tj]s$": [ 'rollup-jest', { useCache: false, resolveImports: process.env.RESOLVE, args: { configType: "tests-internal", silent: true }, configFile: "./rollup.config.js" } ],
};
const moduleNameMapper = {
  "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|sass|scss|css)$": "<rootDir>/tests/mocks/fileMock.js",
};
const moduleFileExtensions = ["ts", "tsx", "js", "jsx", "cjs", "json", "node"];

module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        "<rootDir>/tests/unit/**/*.ts",
      ],
      transform,
      moduleNameMapper,
      moduleFileExtensions,
      testEnvironment: "jsdom",
      setupFiles: ['./jest.setup.js']
    },
    {
      displayName: 'integration',
      preset: 'jest-puppeteer',
      testMatch: [
        "<rootDir>/tests/integration/**/*.ts",
      ],
      moduleNameMapper,
      moduleFileExtensions,
      transform,
    },
  ],
};