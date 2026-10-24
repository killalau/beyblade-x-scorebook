# Data Contracts

Private JSON files are local-only. They are ignored by Git and loaded in the browser through file upload/localStorage.

JSON is the source of truth for this project. Excel workbooks are legacy exports or optional reports, not primary storage.

## `data/collection.local.json`

```json
{
  "version": 1,
  "currency": "CAD",
  "taxRegion": "BC",
  "sourcePreferences": {
    "market": "Canada",
    "defaultBrand": "Hasbro",
    "defaultBrandCondition": "Use only when the exact product exists in the Hasbro catalogue"
  },
  "inventory": {
    "parts": ["3-60", "Rush", "R"],
    "beys": ["Lance Knight 3-60LF"],
    "partsDetail": []
  },
  "purchases": {
    "items": [
      {
        "acquisitionId": "purchase-wand-wizard",
        "name": "Wand Wizard 5-70DB Starter",
        "brand": "Hasbro",
        "source": "Private purchase",
        "pretaxPrice": 20,
        "taxRate": 0,
        "estimatedTotalPaid": 20
      }
    ]
  },
  "trades": {
    "items": [
      {
        "tradeId": "trade-2026-10-21-example",
        "tradedAt": "2026-10-21",
        "source": "Private trade",
        "gave": [
          {
            "name": "Wand Wizard 5-70DB Starter",
            "quantity": 1,
            "fromAcquisitionId": "purchase-wand-wizard",
            "transferredCostBasis": 22.39
          }
        ],
        "received": [
          {
            "acquisitionId": "trade-example-b",
            "name": "Example B",
            "brand": "Hasbro",
            "quantity": 1,
            "costBasis": 27.39,
            "imageUrl": "https://example.com/example-b.jpg"
          }
        ],
        "cashPaid": 5,
        "cashReceived": 0
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
- `purchases.items[].brand`: verified product/release brand, either `Hasbro` or `Takara Tomy`.
- `inventory.partsDetail[].brand`: verified brand of the physical part, either `Hasbro` or `Takara Tomy`.
- `inventory.partsDetail[].names`: the verified localized-name object with exactly `en-US`, `en-JP`, `zh-TW`, and `zh-HK` keys. Values may be `null` only when the reference source has no verified equivalent.

Optional fields:

- `currency`, `taxRegion`: collection-level purchase defaults.
- `sourcePreferences`: collection-level market and brand-inference rules. For this Canadian collection, default an unspecified product to Hasbro only when the exact product/release exists in Hasbro's catalogue. Use Takara Tomy when the user explicitly identifies it or no Hasbro release exists. Explicit product evidence always wins, and an unknown random-booster colour must remain unknown.
- `inventory.partsDetail`: detailed rows for the Inventory page.
- `purchases.items[].imageUrl`: reliable image for an owned product. The Purchase page prefers this image, then falls back to a matching Catalogue listing.
- `purchases.items[].acquisitionId`: stable identity for a specific purchase lot when another event, such as a trade, needs to reference it.
- `trades.items`: immutable trade history. `gave[].fromAcquisitionId` identifies the exact lot leaving the collection; `received[].acquisitionId` creates a new owned lot.

Guidance:

- Include both full names and abbreviations when useful, e.g. `Rush` and `R`, `Unite` and `U`.
- Store part names separately rather than joining aliases with `/`. In this project, `names["en-US"]` means the Hasbro English name and `names["en-JP"]` means the Takara Tomy English name (not Japanese-script text). `names["zh-TW"]` and `names["zh-HK"]` store verified regional Chinese names only for `Blade`, `Main Blade`/`Metal Blade`, and `Lock Chip`. `Assist Blade`, `Over Blade`, `Bit`, `Ratchet`, and accessories have no Chinese part name, so both Chinese fields must be `null`; never import a community database's descriptive translation or repeat an abbreviation in those fields. These fields identify the reusable component, so remove cosmetic release suffixes such as `Metallic Coat: Yellow` or `Red Ver.`; the exact physical release and colour remain represented by `code`, `source`, and its exact image mapping.
- `inventory.partsDetail[].name` is the canonical grouping name and must equal `names["en-JP"] || names["en-US"]`: prefer the TT English name whenever verified, otherwise fall back to the Hasbro English name. Multilingual Inventory presentation applies only to Blade-family and Lock Chip rows: show `en-US` and `zh-HK` by default, then expose `en-JP` and `zh-TW` in the hover/focus tooltip. If `en-US` is unavailable, fall back to the canonical `name` so TT-only and legacy rows remain readable. All other part categories display only the canonical `name` and have no language tooltip. Inventory search still matches every stored name plus `abbrev`.
- Run `npm run sync:part-names -- --dry-run` to preview a multilingual sync from the public phstudy data, then `npm run sync:part-names` to write the authoritative local collection. The sync uses the existing exact release/colour mapping, so it must follow any thumbnail-registry update for a newly added release.
- Store `brand` on every purchase and every raw `partsDetail` row even though the current UI does not display it. The collection-level `defaultBrand` is an inference preference, not persisted evidence for an individual record. A retailer or purchase country does not by itself establish the brand; verify the release or use the user's explicit identification. Runtime loading remains tolerant of older version-one uploads without `brand`, but `npm run validate:data` requires it for the authoritative local collection.
- Include complete combo names only if useful for lookup, but part scoring mainly uses individual parts.
- `inventory.partsDetail[].category` must use the fixed category list: `Blade`, `Lock Chip`, `Main Blade`, `Over Blade`, `Assist Blade`, `Ratchet`, `Bit`, `Launcher`, `Grip`, `Stadium`, `Battle Pass`, `Tool`, or `Complete Combo`. Do not invent or silently map a new persisted category; ask the user to confirm whether the category list should be expanded first.
- `inventory.partsDetail[].line` and `inventory.partsDetail[].bladeSystem` are required only for `Blade` and `Main Blade` rows in the authoritative local collection. `Blade` rows must use `BX` or `UX`; `Main Blade` rows must use `CX`. `bladeSystem` must be `standard` or `expand`; Takara Tomy's Expand Blade and Hasbro's Infinity naming both map to `expand`. These fields describe the Blade/Main Blade's construction, not the product box or source set. Lock Chip + Main Blade + Assist Blade identifies standard CX; an added Over Blade identifies CX Expand/Infinity. Expand/Infinity also exists for BX and UX, so never replace the base `line` with `Expand` or `Infinity`. The Inventory UI displays `∞` after the line for `expand`, while filtering remains BX/UX/CX only. Lock Chip, Over Blade, Assist Blade, Ratchet, Bit, launcher, and accessory rows must store neither field. Do not infer line from a shared bundle code: mixed-line sets must record the correct line on each individual Blade/Main Blade row. Representative UI colours are derived from [Takara Tomy's official line and Expand Blade artwork](https://beyblade.takaratomy.co.jp/beyblade-x/guide/): BX light blue (`#70BBE9`), UX orange (`#EE7700`), and CX pink (`#E7318C`); the app uses darker accessible text variants of those hues on its light background.
- Every `Blade`, `Main Blade`, and `Bit` row must store `inventory.partsDetail[].type` as exactly `Attack`, `Defense`, `Stamina`, or `Balance`. The value describes the official type of that individual part, not necessarily the type of a custom combo containing it. A sortable Type column and a Type filter appear on the merged Blade / Main Blade tab and the Bit tab. Other legacy rows may use `type` for product-shape metadata, but those values are not part classifications and are not displayed in the parts table.
- Keep the exact release/product identifier in `inventory.partsDetail[].code` whenever it is known (for example `G2755-02`, not only the generic combo name). Part thumbnail URLs are public reference metadata and live in the committed static image registry, rather than being duplicated in private collection rows. The registry resolves images by exact release and part category so colour variants from different products remain distinct. If a random-booster colour is unknown, keep that uncertainty explicit; never guess a specific variant merely to obtain a thumbnail.
- Treat `inventory.partsDetail[].code` as a release/variant selector, not as a universal retail identifier. Prefer an official brand product code when it identifies the physical release. A phstudy component ID such as `HB-G4568-BLADE` or `MB-PRD-096177-02` is source-specific and should remain derived public registry metadata; do not copy it into every private part row merely to build a URL. If globally interoperable retail identity is needed later, add an explicitly named product-level `gtin`/`upc`/`jan` field rather than overloading `code`; loose parts normally have no separate retail barcode.
- Every generated `InventoryPartImageRef` contains both `url` and `detailUrl`. For Blade/Ratchet/Bit/CX component images, the direct phstudy detail page is derived from the image category and component ID. For Launcher/Stadium/Grip and other accessories without standalone component pages, link to the exact source-product `Series` page when known and use a release-ID-filtered database search only as fallback. These links use the `zh-HK` locale and are not persisted in `data/collection.local.json`.
- Run `npm run audit:part-images` after changing canonical part names, release codes, or thumbnail mappings. It checks every part row displayed by Inventory, reports rows without mappings, and performs one gentle reachability request per unique thumbnail URL without retries.
- Multipacks must keep each included Bey's child release identifier (for example `G3028-01`, `G3028-02`, and `G3028-03`) on every corresponding part row. Do not replace these with only the parent pack code, because the child identifier selects the correct part and colour images.
- Launcher names describe the physical launcher type, not merely the presence of a ripcord. Record Hasbro's small starter launcher as `Entry Launcher`; reserve `Winder Launcher`, `Long Winder Launcher`, and `String Launcher` for products whose exact contents verify those types.
- When adding an inventory product or purchase, verify and store a reliable `purchases.items[].imageUrl` in the same task. Check the resulting Purchase-page card and do not leave a new product with a missing thumbnail unless no trustworthy image can be found; record that exception explicitly.

The collection file deliberately keeps inventory, purchase history, and trade history as separate sections. Purchases and trades record provenance; current inventory remains authoritative because gifts, losses, sales, and loose parts cannot always be derived from acquisition history.

The Inventory page displays only the owned parts table. The Purchase page displays current owned-product cards, trade history, and complete purchase history. Each purchase-history card shows the tax/shipping-inclusive unit price from `perItemTotal`, or calculates it from the total paid divided by `quantity`; it does not show the purchase subtotal as the card price. An owned-product card averages the cost basis of only its currently held acquisition lots. For a trade, the received cost basis must equal the given item's transferred cost basis plus `cashPaid` minus `cashReceived`; multiple received items require an explicit allocation whose sum follows that formula. The page's net spend is the sum of purchase cash paid plus trade `cashPaid`, minus `soldItems[].salePrice`, `returnedItems[].refundAmount`, and trade `cashReceived`. A transferred cost basis is not new cash spend and must not be counted twice. Keep returned and traded-away purchases in history, but remove disposed products and parts from current inventory. For legacy purchase rows without `estimatedTotalPaid`, the calculation falls back to `pretaxPrice`, applying `taxRate` when present unless `taxIncluded` is true.

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
