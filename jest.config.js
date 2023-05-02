/* eslint sort-keys: ['error'] */

const transform = {
  '\\.ts$': [ 'rollup-jest', { args: { configType: 'tests-internal', silent: true }, configFile: './rollup.config.mjs', useCache: false } ],
};
const moduleNameMapper = {
  '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|sass|scss|css)$': '<rootDir>/tests/mocks/fileMock.js',
};
const moduleFileExtensions = [ 'ts', 'tsx', 'js', 'jsx', 'cjs', 'json', 'node' ];

export default {
  projects: [
    {
      displayName: 'unit',
      extensionsToTreatAsEsm: ['.ts'],
      moduleFileExtensions,
      moduleNameMapper,
      setupFiles: ['./jest.setup.js'],
      testEnvironment: 'jsdom',
      testEnvironmentOptions: {
        url: 'https://nebula.tv',
      },
      testMatch: ['<rootDir>/tests/unit/**/*.ts'],
      transform,
    },
    {
      displayName: 'integration',
      extensionsToTreatAsEsm: ['.ts'],
      moduleFileExtensions,
      moduleNameMapper,
      preset: 'jest-puppeteer',
      testEnvironment: './jestEnv.js',
      testMatch: ['<rootDir>/tests/integration/**/*.ts'],
      testTimeout: 20,
      transform,
    },
  ],
};