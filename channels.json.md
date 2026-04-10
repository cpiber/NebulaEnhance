# channels.json

This file is a *complement* to the [official creator list](https://talent.nebula.tv/creators/).
It was born since that page is slow to update, and often missing information and some channels entirely.
The extension uses both to recognize and connect the channels on YouTube and Nebula, and make the "Watch on Nebula"/"YouTube link" features work.

Since it is maintained manually, I update it only rarely. Contributions are always welcome.

The file is loaded from the master branch in the extension, so no updates are necessary to communicate new channel mappings.


## Structure

The file is always loaded after the official list, as part of a large creator array, so the official list always takes precedence.

In this file, first all creators left out by the official list are filled in.
The `name` is typically the channel name on Nebula, if they are not matching, but it is used as a potential matching criteria in both directions.
The `nebula` and `nebulaAlt` properties are the slugs of the channel(s) on Nebula (since the official list supports side-channels for originals).

Separated by two blank lines follow other Originals channels that have no proper counterpart on YouTube.
Those are mapped to their main channels, in hopes of matching Trailers to Originals and vice-versa.

Lastly, separated by another blank line, follow Originals that have no known creator channel on YouTube.
If a trailor exists on Nebula's official YouTube channel, it is mapped there.
This allows the site-wide fallback to map YouTube trailer to the Original.

If multiple creators are involved in a Originals series, or no related content on YouTube exists, there is no entry.