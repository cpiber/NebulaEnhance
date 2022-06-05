# Dispatch Events

As opposed to the [message-based events](messages.md#events), which allow listening on the content script, dispatch events are triggered from the page.

These events are implemented via `CustomEvent`.
They provide information on page navigation and actions.

The following events are available:
- *`enebula-navigate`, `enebula-navigate-{page}`*: Page navigation occurred. This event is possibly sent before the page has finished loading.
- *`enebula-load`, `enebula-load-{page}`*: Page has finished loading. This is only implemented for `video`, `creator` and `videos` pages, for all others, it fires immediately after `navigate`.
- *`enebula-xhr`*: An xhr request has completed (`XMLHttpRequest` event `loadend`).

`load` and `navigate` details include at least `page` (identifier) and `from` (previous page URL).
For more information on included data see [dispatcher](../src/scripts/page/dispatcher.ts).