import PuppeteerEnvironment from 'jest-environment-puppeteer';

class Env extends PuppeteerEnvironment {
  /**
   * @param {import('@jest/types').Circus.AsyncEvent} event
   * @param {import('@jest/types').Circus.State} state
   */
  async handleTestEvent(event, state) {
    await super.handleTestEvent?.(event, state);
    if (event.name === 'error' && state?.currentlyRunningTest?.errors) {
      // need to filter some exceptions
      // currently occurs in queue > adds proper controls
      state.currentlyRunningTest.errors =
        state.currentlyRunningTest.errors.filter(e => !(e instanceof Error) || !e.message.match(/The play\(\) request was interrupted by a call to pause\(\)|Failed to load because no supported source was found|The element has no supported sources|No player found/));
      if (state.currentlyRunningTest.errors.length)
        console.warn('Collected errors:', ...state.currentlyRunningTest.errors);
    }
  }
}

export default Env;
