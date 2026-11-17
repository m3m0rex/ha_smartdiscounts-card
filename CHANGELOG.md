# Changelog

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
