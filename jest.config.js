const path = require('path');

module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        path.resolve("./__tests__/unit/**/*.js")
      ]
    },
    {
      displayName: 'integration',
			preset: 'jest-puppeteer',
      testMatch: [
        path.resolve("./__tests__/integration/**/*.js")
      ]
    }
  ]
};