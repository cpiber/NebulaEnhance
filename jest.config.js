const path = require('path');

module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        path.resolve("./__tests__/unit/**/*.js")
      ],
      testEnvironment: "jsdom",
    },
    {
      displayName: 'integration',
			preset: 'jest-puppeteer',
      testMatch: [
        path.resolve("./__tests__/integration/**/*.js")
      ],
    },
  ],
};