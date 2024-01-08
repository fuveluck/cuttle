const { defineConfig } = require('cypress');

module.exports = {
  e2e: {
    baseUrl: process.env.VITE_API_URL || 'http://localhost:8080',
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config)
      config.env = {
        ...process.env,
        ...config.env, // Don't overwrite `codeCoverageTasksRegistered` set by `@cypress/code-coverage/task`
      };;
      on("before:browser:launch", (browser = {}, launchOptions) => {
        prepareAudit(launchOptions);
      });

      // It's IMPORTANT to return the config object
      // with any changed environment variables
      return config;
    },
  },
};




module.exports = defineConfig({
  projectId: 'i8bxr8',
  // https://docs.cypress.io/guides/references/configuration#e2e
  e2e: {
    baseUrl: process.env.VITE_API_URL || 'http://localhost:8080',
    specPattern: ['tests/e2e/specs/**/*.spec.js'],
    excludeSpecPattern: ['tests/e2e/specs/playground.spec.js'],
    supportFile: 'tests/e2e/support/index.js',
  },
  // Retry tests 2 times headlessly, no retries in UI
  retries: {
    runMode: 2,
    openMode: 0,
  },
  numTestsKeptInMemory: 25,
  // https://docs.cypress.io/guides/references/configuration#Videos
  video: false,
  // https://docs.cypress.io/guides/references/configuration#Folders-Files
  downloadsFolder: 'tests/e2e/downloads',
  fixturesFolder: 'tests/e2e/fixtures',
  screenshotsFolder: 'tests/e2e/screenshots',
  videosFolder: 'tests/e2e/videos',
});

