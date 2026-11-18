# Changelog

## [1.3.7] – 2026-11-18

### Changed

- **Cheapest shopping trip with more than two stores.** Besides "One store" and "Two stores" the card now also
  suggests three or more stores, as long as each extra store covers more items or makes the trip cheaper.

## [1.3.6] – 2026-11-18

### Added

- **Compare with the bonus.** New option "I use bonus programmes": offers with a bonus are compared at the price
  after the credit is taken off. The real price stays in front, the bonus price follows in brackets – "1,00 €
  (0,50 €)", and the price per unit the same way, "1,33 €/l (0,67 €/l)". Cheapest shopping trip and the ★ for the
  cheapest offer use the bonus price; price history and what goes onto the list keep the real price.

## [1.3.5] – 2026-11-18

### Added

- **Bonus offers are marked clearly.** Offers with a loyalty bonus (for example REWE Bonus, `loyalty_bonus_value` /
  `loyalty_bonus_type`) show "🎁 0,50 € bonus · REWE app only" next to the shop; the tooltip explains that you pay
  the normal price and get the credit in the shop's app. When the same offer also comes from the normal sensor, it is
  shown once – with the bonus.

## [1.3.4] – 2026-11-18

### Fixed

- **With SmartLists the watch list never goes into a to-do list any more.** If the card still had `watch_list` (a
  to-do list) set, every user of the dashboard wrote their watch list into that one list – it then showed up in
  every combined list containing it and triggered "added to list" notifications. With SmartLists everyone's watch
  list is kept per user in Home Assistant; `watch_list` is only used without SmartLists. The tab says so and offers
  to copy what is on the to-do list into your own watch list.

## [1.3.3] – 2026-11-18

### Changed

- **Offers put on a SmartLists list carry the product group of the shop.** SmartLists 4.0.0-beta.15 or newer uses it
  to sort the item into the right category when the name alone is misleading ("Cocktailtomaten" are no drink).

## [1.3.2] – 2026-11-18

### Added

- **All watch lists.** With SmartLists 4.0.0-beta.14 or newer and more than one watch list, the picker offers "All
  watch lists": every product of all your lists together, each with the name of its list. New products go to your
  default list, removing applies to every list. Home Assistant remembers the choice per user – not the browser.

## [1.3.1] – 2026-11-18

### Fixed

- **The watch list could silently end up "on this device"** although SmartLists was installed: when Home Assistant
  did not answer the request, the card fell back to the browser without saying so. With SmartLists the watch list is
  now always kept in Home Assistant. If it cannot be loaded, the card says so and offers "Try again" – nothing is
  written to the device. Products that were stored in the browser before move into your watch list in Home Assistant
  once, and the tab now says where the list is kept.

## [1.3.0] – 2026-11-18

### Added

- **Your own watch lists.** With SmartLists 4.0.0-beta.13 or newer the watch list is no longer shared by the whole
  household: every user has their own, and can keep several (for example "Party" next to the everyday one). The tab
  "Watch list" gets a picker with buttons to add, rename, set the default and delete. Nobody sees the watch lists of
  others, and Home Assistant notifies each user about their own lists. On the first visit you get a copy of the
  former shared list, so nothing is lost.

### Fixed

- **"Cheapest shopping trip" was hard to read** when two shops cover more items: the line showed a higher total next
  to "saves 0,10 €". It now says what the difference is – "2 more items for 3,78 € · the others 0,10 € cheaper".

## [1.2.0] – 2026-11-18

### Changed

- **"Was it cheaper before?" is the same in every browser.** With SmartLists 4.0.0-beta.13 or newer the price history
  is kept in Home Assistant instead of in the browser: Chrome, Firefox and every phone show the same hint, and the
  history also grows while no card is open. What a browser has remembered so far is taken over once. The history
  holds the prices of all offers, not what somebody looked at, so it says nothing about people; prices not seen for
  90 days are dropped. Without SmartLists (or with an older version) the card keeps remembering in the browser as
  before.

## [1.1.0] – 2026-11-17

### Added

- **Cheapest shopping trip.** "My list" works out which single shop has the most of your items on offer and what
  that costs – and whether a second shop covers more items or saves money. Tap a line to select those offers.
- **Offers that start later** (for example next week's leaflet) are kept apart: "All offers" gets a switch
  "Now / From 23.11.", and "My list" names the items that will be on offer soon. They no longer mix with what is
  valid today. The start date comes from `valid_from` / `start_date` (field `from` in `map`).
- **Was it cheaper before?** The card remembers the price of every offer in this browser. When the same product in
  the same shop comes back at a different price, it shows "▲ 0,99 €" (was cheaper) or "▼ 1,79 €" (was dearer) with
  the date. Switch it off with `show_price_trend: false`. Nothing leaves the browser.

## [1.0.2] – 2026-11-17

### ⚠️ Removed

- **"Prices side by side"** (`list_view: chips`) is gone from "My list": it looked different on a wide card than on a
  small one. Three layouts remain – one offer per row (`rows`, the new default), one line per item (`compact`) and the
  table (`table`). A card that still has `list_view: chips` shows `rows`.

### Fixed

- The tab "All offers" has an icon like the other two.
- **My list → table:** on a very wide card the columns ran far apart and the lines between the rows were bent at the
  price cells. The table now grows with the card up to a limit (760 px for the item plus 260 px per store; set your
  own with `table_max_width` in px, `0` = no limit), the lines run straight through the row and the prices stand
  right-aligned under their store.

## [1.0.1] – 2026-11-17

### Changed

- **List view:** price and buttons no longer jump. The price has a column of its own, and every row has the same
  counter (− 0 +) – pale while the item is not on the list, green once it is.

### Fixed

- **Editor:** changing a setting no longer jumps back to the start tab – you stay on the tab you are looking at, and
  the search, the chosen category and what is folded stay as well.
- **My list:** the chosen view is the view you get at every width. A wide card used to switch to the price table on
  its own, so the same view looked different on a small screen (with pictures) than on a large one (without). The
  table is now shown only when "prices side by side" is selected.
- Rows no longer show a store category that says nothing about the product (such as "Store").

## [1.0.0] – 2026-11-17

First release with its own version number. Until now the card was shipped inside the SmartLists integration and carried
its version (4.0.0-beta.x).

### ⚠️ Breaking changes

- **The card is no longer part of SmartLists.** SmartLists 4.0.0-beta.7 and later do not ship it any more – install this
  repository through HACS (Dashboard) to keep `custom:smartdiscounts-card` and the offer hints in the SmartLists card.
- Three options that existed twice were removed: `show_list_tab` (use `tabs`), `notify_service` (use
  `notify_targets`), `compact` (use `list_view: compact`).

### Added

- `category_map` links store categories to your own; the editor lists the categories the sensors report.
- `locked` fixes the view, so it cannot be switched inside the card.
- With a combined SmartLists list everyone picks where new items go.
- One file per language in `lang/` – corrections and new languages by pull request.

### Changed

- Unit prices (€/kg, €/l) on their own line, the lowest one in green.
- Store categories such as "Store" or "Online" no longer count as categories.
- The remembered view belongs to the card, not to the browser.
- The same offer from two sensors appears once; searching no longer redraws the whole card.
