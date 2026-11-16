# SmartDiscounts Card

A Home Assistant dashboard card that shows **supermarket offers matched with your shopping list**.

- **My list:** for every open item of a to-do list the matching offers per store, the cheapest marked ★.
  "Pick cheapest" or "only REWE" selects for the whole list; "Apply to list" writes store, price and validity
  to the items.
- **All offers:** one shelf per store with search and category filter – as tiles or as a compact list with
  small images; "＋ Add to list" adds an offer.
- **Wide cards** (≥ 720 px) show a table of items × stores.
- Works **on its own** – it only needs offer sensors and (optionally) a to-do list. With
  [SmartLists](https://github.com/m3m0rex/ha_smartlists) the selected offer appears as a badge on the item.

> This repository is synced automatically from [ha_smartlists](https://github.com/m3m0rex/ha_smartlists)
> with every release. Please open issues and pull requests there.

## Installation

**HACS:** add `https://github.com/m3m0rex/ha_smartdiscounts-card` as a custom repository (type *Dashboard*),
install "SmartDiscounts Card" and reload the browser.

**Manual:** copy `dist/ha_smartdiscounts-card.js` to `config/www/` and add `/local/ha_smartdiscounts-card.js`
as a dashboard resource (JavaScript module).

If SmartLists 4.0 or newer is installed, the card is already included – no separate installation needed.

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
| `match` | `word` | `word` (butter ≠ butter biscuit), `exact`, `part` |
| `default_tab` | `list` | `list` or `all` |
| `show_images` | `true` | Product images |
| `compact` | `false` | Compact rows |
| `show_unit_price` | `true` | Unit price (€/kg, €/l) |
| `show_valid_until` | `true` | "until 21.11." |
| `hide_without_offer` | `false` | Hide list items without an offer |
| `list_view` | `chips` | "My list": `chips` (prices side by side; a table on wide cards) or `rows` (one offer per row with a small image). ☰ in the card switches. |
| `all_view` | `tiles` | "All offers" as `tiles` or as a `list` with small images (☰ in the card switches, remembered per device) |
| `max_per_store` | `12` | Offers per store before "all →" |
| `currency` | `EUR` | ISO currency code for prices |

### Every option in one configuration

All options with their default values – copy it and delete what you don't need:

```yaml
type: custom:smartdiscounts-card
title: Offers                 # heading (default: "Offers" in your language)
list: todo.shopping           # to-do list to match against (optional)
sources: auto                 # "auto" or a list, see "Sources"
match: word                   # word | exact | part
default_tab: list             # list | all
list_view: chips              # chips | rows
all_view: tiles               # tiles | list
show_images: true             # product images
compact: false                # compact rows
show_unit_price: true         # unit price (€/kg, €/l)
show_valid_until: true        # "until 21.11."
hide_without_offer: false     # hide list items without an offer
max_per_store: 12             # offers per store before "all →"
currency: EUR                 # ISO code for prices
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
compact: true
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

**Swiss francs:**

```yaml
type: custom:smartdiscounts-card
list: todo.einkauf
currency: CHF
```

**Wide dashboard panel** – with `list_view: chips` a card of 720 px or more shows the table of items × stores:

```yaml
type: custom:smartdiscounts-card
list: todo.shopping
list_view: chips
grid_options:
  columns: full
```

## Sources

With `sources: auto` every sensor is used that has a list of offers in one of the attributes
`discounts`, `offers`, `deals`, `items`, `results` or `products`. This covers the integrations
[ha-rewe](https://github.com/FaserF/ha-rewe), [ha-edeka](https://github.com/FaserF/ha-edeka),
[ha-lidl](https://github.com/FaserF/ha-lidl), [ha-aldi](https://github.com/FaserF/ha-aldi) and
[ha-norma](https://github.com/FaserF/ha-norma) – and your own REST or template sensors.

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

## How "Apply to list" works

- **With SmartLists:** the offer is attached to the item and shown there as a badge with store, price and
  validity. Nothing is stored permanently – when the offer expires, the price disappears.
- **Without SmartLists:** a readable line is written to the description of the to-do item,
  e.g. `🏷️ REWE · 1,29 € · until 21.11. · Landliebe Butter`.

## License

MIT
