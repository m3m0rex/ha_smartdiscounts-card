# Changelog

## [1.3.36] – 2026-11-28

### Added

- **`stores_list: true`** (visual editor, below "Only these stores"): "My shopping list" shows only items of the
  stores in `stores`, plus items without a store. The store of an item comes from SmartLists (also a store word in
  the text or the list's default store), otherwise from `@Store` in the text or the offer attached to the item. In
  the embedded SmartLists card this needs SmartLists 4.1.10 or newer; new items added there get no store attached.

## [1.3.35] – 2026-11-27

### Fixed

- **A preview without a start date no longer starts on Sunday.** It started the day after the store's current offers
  end – for offers ending on Saturday that was Sunday. It now starts on the first `preview_start` weekday (default
  Monday) after that day. Without current offers it starts on the next such weekday, today included.

## [1.3.34] – 2026-11-27

### Changed

- **With SmartLists the visual editor no longer shows `watch_list`.** SmartLists keeps a watch list per user, so a
  to-do list in the card settings has no effect there. Without SmartLists the setting stays as before (optional).
- **Removed the "Copy to my watch list" hint.** With SmartLists installed and a `watch_list` still set, the card no
  longer offers to copy the to-do list's entries into the user's own watch list.

## [1.3.33] – 2026-11-26

### Fixed

- **Own tab names keep their icon.** With `label_shop`, `label_all` or `label_watch` set, the 🛒 🏷️ ⭐ in front
  of the name disappeared.

### Added

- **`show_tab_icons: false`** (visual editor → *Header and tabs*) hides the icons on all tabs.
- **`shop_clear_done: false`** (visual editor → *My shopping list*, with `shop_view: smartlists`) removes the
  "Remove completed" button from the embedded SmartLists card.
- **`shop_card:`** passes any option of the SmartLists card on to the embedded card (YAML), for example
  `sort`, `show_clear_done` or `clear_expired_done`. The list itself always comes from `list`.

## [1.3.32] – 2026-11-26

### Changed

- **Visual editor regrouped.** List and stores stay on top; everything else sits in sections named after what
  it changes: *Header and tabs*, *My shopping list*, *All offers*, *Watch list*, *Offer sensors* and *Fix*.
  Each title shows how many settings the section holds. No option was renamed or removed.
- "Hide items without an offer" no longer appears in the editor: it only worked in the old "My list" tab,
  which is switched off.

## [1.3.31] – 2026-11-26

### Added

- **`show_tab_counts: false`** (visual editor → *Look*) hides the counters on the tabs, such as "· 3".

## [1.3.30] – 2026-11-26

### Added

- **Own names for the tabs:** `label_shop`, `label_all` and `label_watch` (visual editor → *Look*) replace
  "My shopping list", "All offers" and "Watch list". Counters such as "· 3" stay behind the name.

## [1.3.29] – 2026-11-25

### Changed

- **README with screenshots** of "My shopping list" and "All offers" (English and German).
- **HACS validation** runs on every push, in preparation for the HACS default catalog.

## [1.3.28] – 2026-11-22

### Fixed

- **"No offer sensors found" on a day without valid offers** (e.g. Sunday, between two leaflets). When only next
  week's preview is there, "All offers" shows it right away; when nothing is valid, the card says so instead of
  asking you to install a sensor.

## [1.3.27] – 2026-11-21

### Changed

- **"Cheaper next week" compares the price per litre or kilo** and shows it ("from 27.11. 1,51 €/l at REWE (instead of
  1,91 €/l)"). Without a unit price on both sides there is no hint – a six-pack is not "cheaper" than a crate.

## [1.3.26] – 2026-11-21

### Added

- **Offers from next week's preview on the shopping list.** An offer added from the preview is written with its
  start date; "My shopping list" lists it under "Not valid yet" with "valid from Mon, 23.11." until that day. The
  total counts what is valid today and names the rest ("+ 0,99 € from 23.11.").
- **"Cheaper next week" hint:** an item that gets a (cheaper) offer in the preview says "from 23.11. for 0,99 € at REWE".
- **Watch list shows preview offers** with "from …"; they are reported only once they are valid.
- **Start of a preview without a date:** the day after the store's current offers end; otherwise the weekday set with
  `preview_start` (default Monday).

## [1.3.25] – 2026-11-21

### Added

- **Choose the preview sensors yourself** (`preview_entities`, editor → *More*): the sensors picked there count as
  next week's offers, whatever they are called. Their list of offers is found even under an unusual attribute name.

## [1.3.24] – 2026-11-21

### Added

- **Preview sensors count as next week's offers.** A sensor with "preview", "vorschau" or "next_week" in its name is
  listed under "from …" in "All offers", also when its offers carry no start date (then from next Monday).
  `preview: true` / `false` on a source sets it by hand.

## [1.3.23] – 2026-11-21

### Added

- **"My shopping list" in the SmartLists style** (`shop_view: smartlists`, editor → *Look*): with SmartLists installed
  the tab shows the connected list in the SmartLists card itself – input, categories, badges, ticking off, offer hints.

## [1.3.22] – 2026-11-21

### Fixed

- **My shopping list showed the price twice** ("1,79 € · 1,79 €") for offers written as a readable note line.

## [1.3.21] – 2026-11-21

### Fixed

- **＋ in "All offers" was still slow with a long list.** For every offer the card went through all items of the
  list on every redraw; the counts are now worked out once per change. ＋ also counts at once when new offers go to
  another list (`add_to`, a source list of a combined list).

## [1.3.20] – 2026-11-21

### Changed

- **Shorter bonus label:** "🎁 0,20 € bonus" instead of "… · only with the REWE app".

## [1.3.19] – 2026-11-21

### Added

- **"On your list" at the top of "All offers":** the offers that are already on the list, with their total; the box
  folds. The offers stay in their shelf as well, so nothing jumps when you tap ＋.

## [1.3.18] – 2026-11-21

### Fixed

- **With SmartLists the tabs could no longer be switched** (1.3.17): the card stopped drawing after loading the list.

## [1.3.17] – 2026-11-21

### Added

- **New tab "My shopping list"** in place of "My list": the items of the connected list, with what came from offers on
  top (store, price, bonus, "until", expired marked), the other items below with a hint when there are offers for
  them, − / + for the count, a circle to tick an item off and the total of the offers on the list. With a combined
  SmartLists list every item names its source list and "＋ Add to" picks where new offers go. Without `list` in the
  card the tab offers to connect a to-do list (remembered in this browser). `tabs` / `default_tab` use `shop`;
  an old `list` is read as `shop`.

## [1.3.16] – 2026-11-21

### Added

- **`show_title: false`** hides the card header (title, number of offers, stores).

## [1.3.15] – 2026-11-21

### Added

- **Without SmartLists: watch lists per user in Home Assistant.** They are kept in Home Assistant's own per-user
  storage instead of this browser – private, the same on all your devices, several lists per user, and every card
  remembers which one it shows. What was kept in the browser moves over once.
- **Keep the watch list as a to-do list** (on request, in the watch-list tab): the products move to an existing
  to-do list or – for admins – a new one, and the card shows them from there for this user. "Keep it private again"
  undoes the link. A `watch_list` set in the card still comes first.

## [1.3.14] – 2026-11-21

### Changed

- **"My list" is switched off for now.** The card starts with "All offers"; `tabs` and `default_tab` that name `list`
  are ignored, and the editor no longer offers the tab, its layouts and "Collect under My list first". The code stays.
  With it the note about expired offers and the "merge duplicates" hint are gone too, as they lived in that tab.
- **"Link store categories" is switched off for now:** the section is gone from the editor and `category_map` is
  ignored. The code stays.

### Added

- **Categories "from the store only"** (`category_source: store_only`): SmartLists is not asked at all; offers without
  a usable store category go to "Other".

### Fixed

- **＋ counts at once.** Adding an offer or changing the count shows the new number immediately and writes to Home
  Assistant in the background; before, the card waited for the write and reloaded list and rights first. A change on
  the list no longer re-reads all offers or asks SmartLists for the categories again.
- **List of offers:** a price with bonus ("1,59 € (1,49 €)") no longer runs into the − 0 + counter; the bonus price
  sits below.
- **Bonus offers:** no tooltip on "🎁 … Bonus · only with the … app" any more – the label says it already.

## [1.3.13] – 2026-11-21

### Added

- **Collect under "My list" first** (`collect_first: true`, visual editor → *More*, off by default). ＋ in "All offers"
  sets an offer aside instead of adding it straight away; "My list" shows the set-aside offers with their total and
  adds them with "Add to list". Kept in this browser, per card. Without the "My list" tab ＋ adds directly as before.

## [1.3.12] – 2026-11-21

### Changed

- **"Cheapest shopping trip" is switched off for now.** "My list" no longer shows "One store / Two stores / 3 stores".
  The calculation stays in the card; `show_cheapest_trip: true` brings it back.
- **"One line per item" (`list_view: compact`) is switched off for now.** "My list" offers "One offer per row" and
  "Table"; a card set to `compact` shows rows.

## [1.3.11] – 2026-11-18

### Fixed

- **Only one tab chosen** (e.g. only "All offers"): the card showed "null" above the search.
- **Bonus offers added to the list** keep the bonus: with SmartLists the item shows "🎁 Bonus" instead of "Offer"
  (SmartLists 4.0.1 or newer); without SmartLists the note says "🎁 0,20 € bonus · only with the REWE app".

## [1.3.10] – 2026-11-18

### Changed

- **Faster first load.** The offers show up at once; the to-do list and the watch list load at the same time instead
  of one after the other, and the categories from SmartLists (the slowest request with many offers) come last.

## [1.3.9] – 2026-11-18

### Added

- **Why a bigger pack is cheaper.** Under a cheapest shopping trip a line like "▸ 1 bigger pack" opens what it
  means: "+4,00 € at the till", "12 l instead of 6 l", "1,00 €/l instead of 1,33 €/l" and "for 6 l that is 1,98 € less".

## [1.3.8] – 2026-11-18

### Fixed

- **Cheapest shopping trip counts by the price per unit.** A bigger pack that is cheaper per litre or kilo now
  wins, and the saving is worked out for the same amount (6 l of cola at 1,00 €/l instead of 1,33 €/l saves 1,98 €),
  not from the pack prices.

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
