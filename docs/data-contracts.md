# Data Contracts

Private JSON files are local-only. They are ignored by Git and loaded in the browser through file upload/localStorage.

JSON is the source of truth for this project. Excel workbooks are legacy exports or optional reports, not primary storage.

## `data/collection.local.json`

```json
{
  "version": 1,
  "currency": "CAD",
  "taxRegion": "BC",
  "inventory": {
    "parts": ["3-60", "Rush", "R"],
    "beys": ["Lance Knight 3-60LF"],
    "partsDetail": []
  },
  "purchases": {
    "items": [
      {
        "name": "Wand Wizard 5-70DB Starter",
        "source": "Private purchase",
        "pretaxPrice": 20,
        "taxRate": 0,
        "estimatedTotalPaid": 20
      }
    ]
  }
}
```

Required fields:

- `version`: currently `1`.
- `inventory.parts`: array of owned part names and useful abbreviations.
- `inventory.beys`: array of owned complete beys/products.
- `purchases.items`: purchase-history array.

Optional fields:

- `currency`, `taxRegion`: collection-level purchase defaults.
- `inventory.partsDetail`: detailed rows for the Inventory page.
- `purchases.items[].imageUrl`: reliable image for an owned product. Inventory prefers this image, then falls back to a matching Catalogue listing.

Guidance:

- Include both full names and abbreviations when useful, e.g. `Rush` and `R`, `Unite` and `U`.
- Include complete combo names only if useful for lookup, but part scoring mainly uses individual parts.

The collection file deliberately keeps inventory and purchase history as separate sections. Purchase history records provenance; current inventory remains authoritative because gifts, trades, losses, sales, and loose parts cannot always be derived from purchases.

The Inventory page displays total spend as the sum of `estimatedTotalPaid`. For legacy rows without that field, it falls back to `pretaxPrice`, applying `taxRate` when present unless `taxIncluded` is true.

Migrate the former two-file format with `npm run migrate:collection`. The command refuses to overwrite an existing collection unless `--force` is explicitly supplied and preserves the legacy input files as recoverable backups.

## `data/normalized/retailer-listings.local.json`

This private catalogue stores cleaned, verified retailer facts independently of the user's inventory and rankings. It retains listings that are not currently eligible for the wishlist.

Required listing fields:

- `listingId`: stable retailer identity such as `amazon-ca:B0GP22FMHL`.
- `retailer`, `name`, `url`.
- `configs`: array of complete normalized combos, not only ratchet/bit fragments.
- CX fused Bits combine the ratchet and Bit into one part. Preserve their code in the complete config; currently recognized codes are `Tr` and `Op`.
- `availabilityStatus`: one of `available_now`, `preorder`, `delayed`, `backorder`, `out_of_stock`, `unavailable`, `not_observed`, or `unknown`.
- `orderable`: boolean retailer ordering signal.

Recommended fields:

- `productId`, `price`, `currency`, `statusLabel`, `bundleType`, `includedBeys`, `cxMode`, `imageUrl`, `availabilityText`, `notes`, `firstSeenAt`, `lastSeenAt`, `lastAvailableAt`, `normalizationStatus`.

Out-of-stock and unavailable records stay here so a later refresh can restore them to the wishlist without losing identity or history.

## `data/retailer-listings.json`

This committed file is a deterministic, sanitized export used by the public Catalogue page. It is not a source of truth. Generate it from the private normalized catalogue with `npm run export:catalogue`.

- Only `normalizationStatus: "verified"` listings are exported.
- Every availability status is retained, including out-of-stock, unavailable, not-observed, and unknown.
- Public product facts such as listing ID, retailer, name, price, configs, status, URL, image, and observation timestamps are retained.
- `notes`, `availabilityText`, location details, raw evidence, and browser/session context are not exported.
- The Catalogue page always loads this public snapshot automatically; the full private normalized catalogue is not loaded into the public app.

Audit and merge commands:

```bash
npm run refresh:wishlist -- --dry-run
npm run refresh:wishlist
npm run audit:normalized
npm run audit:normalized -- --verbose
npm run normalize:crawl -- --dry-run
npm run normalize:crawl
npm run report:candidates
npm run gate:normalized
```

`refresh:wishlist` is the deterministic orchestration command and writes both normalized facts and the derived wishlist. The crawl normalizer updates existing stable listing identities with newer observations and reports unmatched records as candidates. It does not guess normalized names/configs for new candidates. The gate command retains suspicious or incomplete records in normalized data but marks them ineligible. Only `normalizationStatus: "verified"` records can enter the generated wishlist.

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
      "imageUrl": "https://example.com/product-image.jpg",
      "createdAt": "2026-08-01T08:40:47-07:00",
      "url": "https://example.com/product",
      "notes": "Any uncertainty goes here."
    }
  ]
}
```

Required fields:

- `items`: array.

This file is derived. Do not use it as the retailer catalogue. Generate it from normalized listings plus inventory and public ranking/scoring data with `npm run generate:wishlist`.

Recommended fields:

- `name`, `price`, `retailer`, `status`, `url`, `configs`, `parts`, `score`, `costIndex`, `imageUrl`, `createdAt`.

Field guidance:

- `imageUrl`: first reliable product thumbnail from the verified retailer product/listing page. Do not guess image URLs. The app shows a placeholder when missing or broken.
- `createdAt`: ISO 8601 timestamp for when the listing was first added to the local wishlist. Preserve it on later refreshes; use a separate raw collection timestamp for each crawl.
- `parts`: generated structured part array used by the Wishlist filters. Each entry contains `name`, `type`, `owned`, and `rankClass`; fused Bits such as `Tr` and `Op` also use `fused: true`.
- Eligibility excludes normalized `out_of_stock`, `unavailable`, `not_observed`, `unknown`, and `orderable: false` records. Available, preorder, delayed/restock, and orderable backorder records remain eligible.

Sorting behavior in the app:

- Cost Index and price sort ascending.
- Zero or missing Cost Index/price sorts last.
- Score sorts descending.
- Newest added sorts valid `createdAt` values descending; rows without a valid date sort last.

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

## Validation

Run:

```bash
npm run validate:data
```

The validator checks local private JSON files when they exist:

- `data/collection.local.json`
- `data/wishlist.local.json`
- `data/normalized/retailer-listings.local.json`
- every JSON file under `data/raw/`

It also always validates the committed sanitized `data/retailer-listings.json` snapshot when present.

Missing private files are allowed, because a public GitHub Pages checkout will not include them.

Run:

```bash
npm run summarize:data
```

This prints counts for local inventory, purchases, wishlist, and raw files.
