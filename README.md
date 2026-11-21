# SmartDiscounts

*Dashboard card for Home Assistant*

[![Version](https://img.shields.io/github/v/release/m3m0rex/ha_smartdiscounts-card?label=version&color=41BDF5)](https://github.com/m3m0rex/ha_smartdiscounts-card/releases) [![HACS](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/) [![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/m3m0rex/ha_smartdiscounts-card/blob/main/LICENSE)

**English** · [Deutsch](README.de.md)

A Home Assistant dashboard card that shows **supermarket offers matched with your shopping list**.

> **Note:** instead of "My list" there is the tab **"My shopping list"** from 1.3.17: the items of the connected list,
> what came from offers on top, with a counter and ticking off. The sections below about "My list" ("Apply to list")
> apply again once that tab is back.

- **All offers:** one shelf per store with search and category filter – as tiles or as a compact list with
  small images; "＋ Add to list" adds an offer.
- **Expired offers** on the list are pointed out and can be removed in one go.
- **Bonus offers** (e.g. REWE Bonus) are marked as "only with the bonus app"; on request prices are compared with
  the bonus taken off.
- **Watch list:** products you are waiting to see on offer – with a notification if you like. With SmartLists every
  user has their own watch lists, stored in Home Assistant.
- **Six languages:** German, English, French, Spanish, Italian, Polish – following the language of Home Assistant.
- Works **on its own** – it only needs offer sensors and (optionally) a to-do list. With
  [SmartLists](https://github.com/m3m0rex/ha_smartlists) the selected offer appears as a badge on the item.

> SmartDiscounts has its own repository and releases – independent of SmartLists. Issues and pull requests
> are welcome here.

## Live demo

Try the real card with sample data: **[ha-smartlists.com → Discounts Card](https://ha-smartlists.com/en/#card)**

## Installation

**HACS:** add `https://github.com/m3m0rex/ha_smartdiscounts-card` as a custom repository (type *Dashboard*),
install "SmartDiscounts" and reload the browser.

Requires Home Assistant 2024.9 or newer.

**Manual:** copy `dist/ha_smartdiscounts-card.js` to `config/www/` and add `/local/ha_smartdiscounts-card.js`
as a dashboard resource (JavaScript module).

The card works with and without [SmartLists](https://github.com/m3m0rex/ha_smartlists). Since SmartLists 4.0.0-beta.7
SmartLists no longer ships it – it is installed only from here and has its own version number.

**Coming from an older SmartLists beta:** install the card through HACS as above and reload the browser. Your
configuration stays valid. Removed: `show_list_tab` (now `tabs`), `notify_service` (now `notify_targets`) and `compact`
(no replacement).

## Configuration

```yaml
type: custom:smartdiscounts-card
list: todo.shopping        # optional: any Home Assistant to-do list
```

| Option | Default | Description |
|---|---|---|
| `list` | – | To-do list to match offers against |
| `title` | "Offers" | Heading |
| `sources` | `auto` | `auto`, or a list of sources (see below) |
| `stores` | – | Only these stores, e.g. `[REWE]` – selectable in the editor (one card per store) |
| `entities` | – | Only these offer sensors – selectable in the editor |
| `add_to` | – | Add to this list, e.g. your own source list of a combined list (empty = `list`) |
| `mine_only` | `false` | Combined SmartLists list: only consider items from lists that belong to the signed-in user |
| `tile_flow` | `grid` | Tiles top to bottom in a grid (`grid`) or in one row to swipe (`scroll`) |
| `tabs` | `[list, all, watch]` | Which tabs in which order – e.g. `[all, watch]`; with only one tab the bar disappears |
| `group_by` | `store` | Group "All offers" by `store` or by `category`; 🗂️ in the card switches |
| `categories_open` | `true` | Categories expanded; `false` = start folded |
| `category_source` | `auto` | `auto`: categories from SmartLists, otherwise from the store · `store`: the store's own, otherwise SmartLists · `store_only`: only the store's own (none → "Other") |
| `locked` | – | Fix the view: whatever is listed cannot be switched inside the card – `[list_view, all_view, group_by, add_to]` or `true` for everything |
| `match` | `word` | `word` (butter ≠ butter biscuit), `exact`, `part` |
| `show_title` | `true` | `false` hides the card header (title, number of offers, stores). |
| `shop_view` | `own` | "My shopping list": `own` (own view, offers on top) or `smartlists` (the list in the SmartLists card, needs SmartLists). |
| `default_tab` | `all` | `shop`, `all` or `watch` |
| `show_images` | `true` | Product images |
| `show_unit_price` | `true` | Unit price (€/kg, €/l) |
| `show_valid_until` | `true` | "until 21.11." |
| `show_price_trend` | `true` | "▲ 0,99 €" / "▼ 1,79 €" when the same product in the same shop was cheaper or dearer before. With SmartLists (4.0.0-beta.13 or newer) the prices are remembered in Home Assistant – the same in every browser; without it, in this browser only. |
| `hide_without_offer` | `false` | Hide list items without an offer |
| `use_bonus` | `false` | "I use bonus programmes": compare bonus offers at the price after the credit – real price first, bonus price in brackets |
| `all_view` | `tiles` | "All offers" as `tiles` or as a `list` with small images (☰ in the card switches, remembered per device) |
| `max_per_store` | `10` | Offers per store before "all →" (1–20) |
| `currency` | `EUR` | ISO currency code for prices |
| `currency_symbol` | – | Own symbol instead of `currency`, e.g. `₺` – shown after the amount |
| `watch` | – | Watch list: a list of products, e.g. `[coffee, chocolate spread]` |
| `watch_list` | – | Only **without** SmartLists: watch list as a to-do list – the same on all devices, editable in the card. With SmartLists it is ignored (see below). |
| `notify` | `false` | Only **without** SmartLists: notification when something on the watch list is newly on offer (with SmartLists, SmartLists notifies) |
| `notify_targets` | – | Also send to these targets – selectable in the editor, e.g. `[notify.mobile_app_pixel]` (several possible) |

### Every option in one configuration

All options with their default values – copy it and delete what you don't need:

```yaml
type: custom:smartdiscounts-card
title: Offers                 # heading (default: "Offers" in your language)
list: todo.shopping           # to-do list to match against (optional)
sources: auto                 # "auto" or a list, see "Sources"
match: word                   # word | exact | part
default_tab: all              # shop | all | watch
list_view: rows               # rows | table
all_view: tiles               # tiles | list
show_images: true             # product images
show_unit_price: true         # unit price (€/kg, €/l)
show_valid_until: true        # "until 21.11."
hide_without_offer: false     # hide list items without an offer
use_bonus: false              # compare bonus offers at the price after the credit
max_per_store: 10             # offers per store before "all →"
currency: EUR                 # ISO code for prices
currency_symbol: "₺"          # own symbol instead of currency (optional)
watch:                        # watch list: fixed products (optional)
  - coffee
  - chocolate spread
watch_list: todo.watchlist    # watch list as a to-do list (optional)
notify: false                 # notify when a watched product is newly on offer
notify_targets:               # also send to the phone (optional)
  - notify.mobile_app_pixel
```

### Examples

**Smallest configuration** – only show the offers, no list:

```yaml
type: custom:smartdiscounts-card
```

**Matched with a shopping list** (most common):

```yaml
type: custom:smartdiscounts-card
list: todo.shopping
```

**Phone: everything as compact lists with small images:**

```yaml
type: custom:smartdiscounts-card
list: todo.shopping
list_view: rows
all_view: list
```

**Text only, no images** (saves mobile data):

```yaml
type: custom:smartdiscounts-card
list: todo.shopping
show_images: false
list_view: rows
all_view: list
```

**Flyer on a wall tablet** – start with all offers, show more per store:

```yaml
type: custom:smartdiscounts-card
title: This week's offers
default_tab: all
all_view: tiles
max_per_store: 30
```

**Only what is on offer** – hide list items without a match, strict matching:

```yaml
type: custom:smartdiscounts-card
list: todo.shopping
hide_without_offer: true
match: exact
```

**Only selected stores** – name the sensors instead of `auto`:

```yaml
type: custom:smartdiscounts-card
list: todo.shopping
sources:
  - sensor.rewe_123456
  - entity: sensor.lidl_offers
    store: Lidl
```

**Own sensor in addition to the detected ones** (all `map:` fields are listed under "Sources"):

```yaml
type: custom:smartdiscounts-card
list: todo.shopping
sources:
  - auto
  - entity: sensor.my_market
    attribute: results
    store: Kaufland
    color: "#e10915"
    map:
      name: product.name
      price: prices.current
      old_price: prices.regular
      until: validity.to
```

**A card only for REWE, grouped by category:**

```yaml
type: custom:smartdiscounts-card
title: REWE
list: todo.shopping
stores:
  - REWE
default_tab: all
group_by: category
categories_open: false
```

**Swiss francs:**

```yaml
type: custom:smartdiscounts-card
list: todo.einkauf
currency: CHF
```

**Watch list with a notification on the phone:**

```yaml
type: custom:smartdiscounts-card
list: todo.shopping
default_tab: watch
watch_list: todo.watchlist
notify: true
notify_targets:
  - notify.mobile_app_pixel
```

**Own currency symbol** (for currencies without a matching ISO code):

```yaml
type: custom:smartdiscounts-card
list: todo.shopping
currency_symbol: "₺"
```

**Wide dashboard panel** – the table of items × stores:

```yaml
type: custom:smartdiscounts-card
list: todo.shopping
list_view: table
grid_options:
  columns: full
```

## Sources

With `sources: auto` every sensor is used that has a list of offers in one of the attributes
`discounts`, `offers`, `deals`, `items`, `results` or `products`. This covers the integrations by [FaserF](https://github.com/FaserF) –
[ha-rewe](https://github.com/FaserF/ha-rewe), [ha-edeka](https://github.com/FaserF/ha-edeka), [ha-lidl](https://github.com/FaserF/ha-lidl), [ha-aldi](https://github.com/FaserF/ha-aldi), [ha-norma](https://github.com/FaserF/ha-norma) –
and your own REST or template sensors.

Field names are recognised automatically:

| `map:` key | Meaning | Recognised automatically |
|---|---|---|
| `name` | Product name (**required**) | `product`, `title`, `name`, `product_name`, `description` |
| `price` | Offer price (**required**) | `price`, `new_price`, `discount_price`, `offer_price`, `sale_price`, `price_euro`, `current_price` |
| `old_price` | Regular price, shown struck through | `old_price`, `regular_price`, `original_price`, `was_price` |
| `discount` | Discount, e.g. "-44%" (otherwise calculated from old and new price) | `discount`, `discount_percent`, `savings` |
| `unit` | Unit price text, e.g. "1 kg = 5,16 €" – used to compare stores | `price_per_unit`, `base_price`, `unit_price` |
| `image` | Image URL | `picture_link`, `image_url`, `image`, `picture`, `img`, `thumbnail` |
| `until` | Valid until (`YYYY-MM-DD`); expired offers are hidden | `valid_until`, `end_date`, `valid_to`, `until` |
| `from` | Valid from (`YYYY-MM-DD`); offers that start later are shown apart as "From …" | `valid_from`, `start_date`, `valid_start`, `from` |
| `category` | Category for the filter | `category`, `categories`, `group` |
| `brand` | Brand (searchable) | `brand`, `manufacturer` |
| `store` | Store of this single offer (for sensors that mix several stores) | `store`, `market`, `retailer`, `advertiser` |

These ten keys are everything the card reads from an offer. Only `name` and `price` are required – anything
missing is simply not shown.

Prices may be numbers or text ("11,49 €", "1.11 €"). Expired offers are hidden.

### Own sensors and field mapping

A dot reaches into nested data (`product.name`), a number picks an entry of a list (`images.0.url`).

```yaml
type: custom:smartdiscounts-card
list: todo.shopping
sources:
  - auto                              # keep the automatic detection
  - entity: sensor.my_market          # own sensor
    store: Kaufland                   # name shown on the badge (default: from the entity name)
    color: "#e10915"                  # badge colour (optional)
    attribute: results                # attribute with the list (default: detected)
    map:                              # left: the card's field, right: the field of your sensor
      name: product.name              # product name (required)
      price: prices.current           # offer price (required) – number or text like "1,29 €"
      old_price: prices.regular       # regular price
      discount: discount              # e.g. "-44%"
      unit: unitPriceText             # e.g. "1 kg = 5,16 €"
      image: images.0.url             # image URL
      until: validity.to              # valid until, YYYY-MM-DD
      category: category              # category
      brand: brand                    # brand
      store: retailer.name            # store per offer (instead of `store:` above)
```

The store is taken from `store:`, a `store` field of the offer, or the entity name
(REWE, EDEKA, Lidl, ALDI, Norma, Penny, Kaufland, Netto, dm, Rossmann and Globus are recognised).

## Watch list and notifications

The **⭐ Watch list** tab holds products you are waiting to see on offer. For each one you see the current offers;
the number on the tab shows how many watched products are on offer right now.

Where the watch list is stored:

- **With SmartLists** (4.0.0-beta.14 or newer) every Home Assistant user has **their own** watch lists – one file per
  user in Home Assistant (`.storage/smartlists/watch/<user>`), the same in every browser and on every device. Each
  user can create further watch lists in the card ("New watch list"), no admin rights needed; "All watch lists"
  shows everything of the user together. Other users never see them, and they never turn up in a shopping list
  or a combined list. `watch_list:` is ignored then – if one is still set, the card offers to copy its open
  entries once. SmartLists checks for new offers even with no dashboard open; each user picks their own targets
  in the SmartLists settings (Global → Prices & currency → Watch list). The target "In Home Assistant" is seen by
  the whole household, so only admins can choose it.
- **Without SmartLists:** `watch:` – fixed products in the configuration; `watch_list:` – a Home Assistant to-do
  list, the same on all devices; with neither, your watch lists are kept **per user in Home Assistant** (private, on all your devices, several lists possible). In the watch-list tab "Keep as a to-do list" moves a list to a to-do list later.

With `notify: true` (only without SmartLists) the card creates a Home Assistant notification as soon as a watched
product is newly on offer; `notify_targets` also sends it e.g. to your phone. Every offer is reported once per device.

> **Important:** the check runs in the card. It reports while a dashboard with the card is open (e.g. on a wall
> tablet). If Home Assistant should notify without an open dashboard, use an automation:

```yaml
automation:
  - alias: Coffee on offer
    triggers:
      - trigger: state
        entity_id: sensor.rewe_123456
    conditions:
      - condition: template
        value_template: >
          {{ state_attr('sensor.rewe_123456', 'discounts') | default([], true)
             | selectattr('product', 'search', 'coffee', ignorecase=true) | list | count > 0 }}
    actions:
      - action: notify.mobile_app_pixel
        data:
          title: Coffee on offer
          message: >
            {{ state_attr('sensor.rewe_123456', 'discounts')
               | selectattr('product', 'search', 'coffee', ignorecase=true)
               | map(attribute='product') | join(', ') }}
```

## What is stored where

| What | With SmartLists | Without SmartLists |
|---|---|---|
| Watch lists | One file per user in Home Assistant (`.storage/smartlists/watch/`) | `watch_list` to-do list, otherwise this browser |
| Price history ("▲ / ▼") | In Home Assistant, the same for everyone; old entries drop out when an offer ends | This browser only |
| Chosen view (tab, layout, open categories) | Per card, in this browser | Per card, in this browser |
| Offers applied to the list | On the to-do item (badge) | In the item's description |

Nothing leaves your Home Assistant: the card only reads your offer sensors. Product images are loaded by your
browser from the addresses in the sensors.

## Next week's offers

When an offer starts in the future, "All offers" shows a switch "Now / from …" at the top. A sensor with "preview",
"vorschau" or "next_week" in its name (e.g. `sensor.rewe_preview`) counts as a preview as a whole: its offers are
listed under "from …" even without a start date: then from the day after the store's current offers end, otherwise from the
weekday in `preview_start` (default `monday`). If your sensor is named differently, pick it in the editor under "More" → "Sensors with next week's offers"
(`preview_entities: [sensor.xyz]`). With your own `sources:`, `preview: true` or `preview: false` sets it per source.

An offer added from the preview is listed under "My shopping list" in the block "Not valid yet" with "valid from …"
and does not count towards the total; on its first day it moves up by itself. When an item on your list gets cheaper
next week, a hint on the item says so. The watch list shows preview offers with "from …" and reports them only once
they are valid.

## Expired offers

When an offer you applied to the list has run out, the card shows a note above "My list" with **Remove** and
**Later**. "Remove" takes store, price and validity off the items – the items themselves and their notes stay.

## How "Apply to list" works

- **With SmartLists:** the offer is attached to the item and shown there as a badge with store, price and
  validity. Once it has expired it is marked as such and can be removed (see above).
- **Without SmartLists:** a readable line is written to the description of the to-do item,
  e.g. `🏷️ REWE · 1,29 € · until 21.11.2026 · Markenbutter`.

## Recommended integrations – thanks to FaserF

The card does not bring any offer data itself: it shows what sensors in your Home Assistant deliver. For that we
recommend the integrations by [FaserF](https://github.com/FaserF) – many thanks for this work! All his projects:
[hassio-addons.fabiseitz.de](https://hassio-addons.fabiseitz.de/)

| | Integration | What it provides |
|---|---|---|
| 🏷️ | [ha-grocery-deals](https://github.com/FaserF/ha-grocery-deals) | Multi-store price comparison: aggregates the store integrations |
| 🔴 | [ha-rewe](https://github.com/FaserF/ha-rewe) | REWE: weekly offers, bonus points and discounts |
| 🟡 | [ha-edeka](https://github.com/FaserF/ha-edeka) | EDEKA: weekly offers, discounts and PAYBACK card |
| 🔵 | [ha-lidl](https://github.com/FaserF/ha-lidl) | Lidl Plus: weekly offers, coupons and digital receipts |
| ⚪ | [ha-aldi](https://github.com/FaserF/ha-aldi) | ALDI Süd and ALDI Nord: weekly flyers |
| 🔴 | [ha-norma](https://github.com/FaserF/ha-norma) | Norma: weekly discounts and flyer offers |
| 🔴 | *[ha-penny](https://github.com/FaserF/ha-penny)* | *PENNY: digital receipts (eBons) and loyalty points – no flyer offers so far* |

The card is an independent project and not affiliated with FaserF or the stores mentioned.

## Translations and development

One file per language in `lang/` (`de.json` is the reference, `en.json` the fallback) – corrections and new languages
are welcome as pull requests. The card is built from the parts in `src/`: `python3 scripts/build.py` writes
`dist/ha_smartdiscounts-card.js`; `python3 -m pytest tests` runs the tests. Changes are listed in
[CHANGELOG.md](CHANGELOG.md).

SmartDiscounts is not an official product of Home Assistant or the Open Home Foundation.

## License

MIT

## Legal notice

[Legal notice (Impressum)](https://ha-smartlists.com/en/legal-notice/) · [Privacy policy](https://ha-smartlists.com/en/privacy/)
