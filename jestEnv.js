import PuppeteerEnvironment from 'jest-environment-puppeteer';

class Env extends PuppeteerEnvironment {
  /**
   * @param {import('@jest/types').Circus.AsyncEvent} event
   * @param {import('@jest/types').Circus.State} state
   */
  async handleTestEvent(event, state) {
    await super.handleTestEvent?.(event, state);
    // const ignoredEvents = [ 'setup',
    //   'add_hook',
    //   'start_describe_definition',
    //   'add_test',
    //   'finish_describe_definition',
    //   'run_start',
    //   'run_describe_start',
    //   'test_start',
    //   'hook_start',
    //   'hook_success',
    //   'test_fn_start',
    //   'test_fn_success',
    //   'test_done',
    //   'test_skip',
    //   'run_describe_finish',
    //   'run_finish',
    //   'teardown' ];
    // if (!ignoredEvents.includes(event.name)) {
    //   console.log(new Date().toString() + ' Unhandled event(' + event.name + '): ' + inspect(event));
    //   console.log(inspect(state.unhandledErrors));
    //   console.log(inspect(state.currentlyRunningTest.errors));
    // }
    if (event.name === 'error' && state?.currentlyRunningTest?.errors) {
      // need to filter some exceptions
      // currently occurs in queue > adds proper controls
      state.currentlyRunningTest.errors =
        state.currentlyRunningTest.errors.filter(e => !(e instanceof Error) || !e.message.match(/The play\(\) request was interrupted by a call to pause\(\)|Failed to load because no supported source was found|The element has no supported sources/));
      if (state.currentlyRunningTest.errors.length)
        console.warn('Collected errors:', ...state.currentlyRunningTest.errors);
    }
  }
}

export default Env;
