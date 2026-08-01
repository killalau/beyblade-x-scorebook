# Data Contracts

Private JSON files are local-only. They are ignored by Git and loaded in the browser through file upload/localStorage.

## `data/inventory.local.json`

```json
{
  "parts": ["3-60", "Rush", "R"],
  "beys": ["Lance Knight 3-60LF"],
  "partsDetail": [
    {
      "category": "Ratchet",
      "name": "3-60",
      "abbrev": "3-60",
      "code": "BX-21 / G1671",
      "type": "-",
      "spin": "-",
      "qty": 1,
      "source": "Lance Knight 3-60LF",
      "notes": "Core low ratchet.",
      "sourceUrl": "https://example.com"
    }
  ]
}
```

Required fields:

- `parts`: array of owned part names and useful abbreviations.
- `beys`: array of owned complete beys/products.

Optional fields:

- `partsDetail`: detailed rows for the Inventory page.

Guidance:

- Include both full names and abbreviations when useful, e.g. `Rush` and `R`, `Unite` and `U`.
- Include complete combo names only if useful for lookup, but part scoring mainly uses individual parts.

## `data/purchases.local.json`

```json
{
  "currency": "CAD",
  "taxRegion": "BC",
  "items": [
    {
      "name": "Wand Wizard 5-70DB Starter",
      "source": "Private purchase",
      "pretaxPrice": 20,
      "taxRate": 0,
      "estimatedTotalPaid": 20,
      "recordedFrom": "User bought from individual on 2026-07-30",
      "notes": "No tax assumed."
    }
  ]
}
```

Required fields:

- `items`: array.

Recommended fields:

- `currency`, `taxRegion`, `pretaxPrice`, `taxRate`, `estimatedTotalPaid`.

## `data/wishlist.local.json`

```json
{
  "currency": "CAD",
  "items": [
    {
      "costIndex": 7.5,
      "score": 12,
      "name": "Example Dual Pack",
      "price": 19.99,
      "retailer": "Amazon",
      "status": "available",
      "bundleType": "Dual Pack",
      "includedBeys": "Bey A, Bey B",
      "configs": "Bey A 3-60R, Bey B 5-60B",
      "usefulParts": "3-60, R",
      "helpsInventory": "Adds missing attack bit",
      "url": "https://example.com/product",
      "notes": "Any uncertainty goes here."
    }
  ]
}
```

Required fields:

- `items`: array.

Recommended fields:

- `name`, `price`, `retailer`, `status`, `url`, `configs`, `score`, `costIndex`.

Sorting behavior in the app:

- Cost Index and price sort ascending.
- Zero or missing Cost Index/price sorts last.
- Score sorts descending.

## Raw Crawl Files

Put raw captures under `data/raw/`.

Examples:

- `data/raw/amazon_beyblade_details.json`
- `data/raw/walmart_beyblade_results.json`
- `data/raw/amazon_search_refresh_YYYY-MM-DD.json`

Raw files may use source-specific shapes, but each record should preserve:

- source URL,
- collected timestamp,
- raw title,
- raw price/availability text,
- any product IDs such as ASIN or Walmart item ID.

## Public Reference Data

Public, commit-safe reference data lives under `src/reference-data/`.

- `scoringConfig.js`: rank scores, part type weights, rarity multipliers.
- `rankings/bbxWeekly.js`: BBX Weekly parts rankings.
- `rankings/gamerPost.js`: Gamer Post image tier parts rankings.
- `names.js`: aliases, bit names, CX code helpers.

These files should not contain private inventory, purchases, or retailer scrape results.
