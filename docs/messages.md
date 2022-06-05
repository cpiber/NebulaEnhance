# Messaging

To communicate with the browser-part of the extension, Enhancer for Nebula defines a few messages.
These are also available for user scripts.

Request messages take the following form:

```ts
{
  type: string; // type of the event
  name: string; // unique identifier to reply to
  ... // event data
}
```

The reply will be of this form:

```ts
{
  type: string; // unique identifier specified as `name` in request
  err?: any;    // error data
  res?: any;    // success data
}
```

It can be assumed that only one of `res` and `err` will be set.
Exactly one message will be sent with `type` set to the specified `name` (assuming a correct message).

Note that `postMessage` requires the data to be JSON; requests must be `JSON.stringify`d and responses `JSON.parse`d.

Enhancer for Nebula will answer to events of the [Message enum](../src/scripts/helpers/shared/constants.ts#L2).
An example of how to send messages can be found in [sendMessage function](../src/scripts/helpers/shared/communication.ts#L7).

It is recommended to follow the scheme of `enhancer-message-...` for the message `name`.

The handler for queue events is defined [here](../src/scripts/content/queue/listener.ts#L46), all other events are handled [here](../src/scripts/content/nebula/message.ts#L24).
For more information on events, see [Events](#events).


## Events

Currently, only one event is exposed from the browser part to the content part.
To listen for the event, send a `registerListener` message with the `event` property set as per the [events enum](../src/scripts/helpers/shared/constants.ts#L14).
Events work exactly the same as messages except that multiple messages are sent with the same `type`.

An example of how to listen to events can be found in [sendEventHandler function](../src/scripts/helpers/shared/communication.ts#L35).

It is recommended to follow the scheme of `enhancer-event-...` for the message `name`.