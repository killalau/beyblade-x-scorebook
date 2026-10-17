# React Feature-Parity Baseline

This document records the observable behavior of the current vanilla JavaScript application before the React migration. The React implementation may improve presentation and accessibility, but it must preserve these data semantics and user capabilities before production cutover.

The fixtures and examples in this document are synthetic or public. Do not copy private local collection, wishlist, normalized retailer, or raw crawl data into migration tests.

## Application-Wide Behavior

- The application is a static GitHub Pages site with no backend.
- The default page is Scorebook.
- Navigation exposes Scorebook, Inventory, Purchase, Wishlist, Catalogue, and Rules.
- Collection and wishlist JSON are loaded through browser file inputs.
- Uploaded private data is stored only in browser `localStorage`.
- The public Catalogue loads automatically from `data/retailer-listings.json`.
- Data-load status and validation errors appear in the shared status strip.
- Clear local data removes loaded collection, legacy inventory, and wishlist state, then reloads the public Catalogue.
- User-provided and retailer-provided text is escaped before HTML rendering.
- External product links open in a new tab with `noreferrer`.

## Browser Storage Compatibility

The React migration must continue reading these keys so existing browser data survives the upgrade:

| Key | Purpose |
| --- | --- |
| `beybladeScorebook.collection` | Uploaded collection, file name, and saved timestamp. |
| `beybladeScorebook.inventory` | Legacy inventory fallback when no collection is saved. |
| `beybladeScorebook.wishlist` | Uploaded wishlist, file name, and saved timestamp. |
| `beybladeScorebook.wishlistView` | `card` or `list`. |
| `beybladeScorebook.wishlistPartFilters` | Persisted wishlist part-filter state. |

Invalid saved JSON is discarded safely. Collection files require version `1`, an inventory object with `parts` and `beys` arrays, and a `purchases.items` array. Wishlist files require an `items` array. Public Catalogue items require stable `listingId` values.

## Scorebook

### User capabilities

- Add and remove any number of product rows; removing the final row leaves one empty row.
- Enter a product/combo, price, and independent CX-mode checkbox for each row.
- Enter comma-separated rare parts.
- Recalculate immediately when row values change and explicitly through Calculate.
- View one summary result per product row and select which result supplies the detailed breakdown.
- View score, Cost Index, inventory part count, parsed parts, ranks, rarity, cost contributions, and sources.
- Load a public saved sample into the editor.

### Representative expected results

| Scenario | Expected result |
| --- | --- |
| `Keel Shark 3-60LF`, price `12.99` | Score `4`. |
| Owned dual pack parts `3-60` and `U`, with `Gill Shark` rare | Dual-pack score `6`; Cost Index is unavailable when all positive contribution is removed. |
| `Buster Dran 1-60A` | Parses `Dran Buster` as a Blade. |
| `Blast Pegasus A Tr` in CX mode | Parses Blast/Blade, Pegasus/Lock Chip, A/Assist Blade, Tr/Bit; Blast is T0 with part score `7.5`. |
| `Blitz Bahamut BK 1-50I` in CX mode | Parses Blitz, Bahamut, Break, Knuckle, 1-50, Ignition. |
| `Brachio Whip OW5-70Nr` in CX mode | Parses Whip, Brachio, Outer, Wheel, 5-70, Narrow. |
| `Might Emperor HOp` in CX mode | Treats `Op` as a fused Bit. |

The formulas and source data remain those documented on the Rules page and under `src/reference-data/`.

## Inventory

### User capabilities

- Display owned parts only; product cards belong to Purchase.
- Switch between Blade/Main Blade, Clip Lock, Over Blade, Assist Blade, Ratchet, Bit, and Others tabs.
- Merge Blade and Main Blade into the same display tab while preserving their stored categories.
- Search the active category by part full name or abbreviation.
- Clear the part search.
- Display category, line, part name, abbreviation, grouped quantity, source products, and notes.
- Exclude `Complete Combo` rows from the parts table.
- Keep Launcher, Grip, Stadium, Battle Pass, Tool, and other fixed accessory categories under Others.

### Representative expected results

| Scenario | Expected result |
| --- | --- |
| One Turn assist blade from each of two products | One grouped Turn row with quantity `2` and both sources. |
| A legacy Turn row with quantity `1` plus a cumulative row with quantity `2` | Grouped quantity remains `2`, not `3`. |
| Legacy `Metal Blade` category | Canonical category is Main Blade. |
| Blade line rules | Blade permits BX/UX; Main Blade uses CX; non-blade parts do not derive their line from the product box. |
| Search `LR` or `7-60` | Match against part name or abbreviation in the active tab only. |

## Purchase

### Current Collection

- Display one card for each currently owned product in `inventory.beys`.
- Prefer the matched purchase image, then a matching public Catalogue image, then a placeholder.
- Match duplicate purchases to one with remaining owned quantity where possible.
- Display product name, purchase source, and tax/shipping-inclusive unit price.
- Display owned-product count, purchase-record count, and net spend.

### Purchase History

- Display every purchase record, newest recorded row first.
- Display image, name, source, quantity when greater than one, recorded date text, and unit paid.
- Unit paid uses `perItemTotal` when present; otherwise it divides total paid by quantity.
- Quantity-one records show their total paid as the unit price.
- Show Kept when no disposal event is recorded.
- Show Sold, Returned, and Gifted badges with product names and applicable sale/refund values.
- Net spend equals total paid minus sale proceeds minus refunds. Gifts still count as spending.

### Representative expected results

| Scenario | Expected result |
| --- | --- |
| Total paid `60.71`, quantity `2` | Unit paid `$30.36`. |
| Total paid `85.94`, quantity `3`, `perItemTotal` `28.65` | Unit paid `$28.65`. |
| Purchases `22.39`, `20.00`, and `11.20`; sale `5.00`; refund `3.00` | Net spend `$45.59`. |
| One disposed Glory Valkyrie purchase and one currently owned purchase | Current Collection selects the remaining owned purchase. |

## Wishlist

### User capabilities

- Upload and persist private wishlist JSON.
- Search across the full wishlist record.
- Switch between card and list views and persist that choice.
- Sort by Cost Index, score, price, newest added, or name.
- Filter by one or more comma-separated part names/abbreviations.
- Restrict part matches by Main Blade, Lock Chip, Over Blade, Assist Blade, Ratchet, or Bit.
- Choose any-part or all-parts matching.
- Enable Only missing parts so owned matching parts do not qualify.
- Clear all part filters.
- Display image, product, price, score, Cost Index, retailer, availability, useful parts, and created date.
- Replace a failed wishlist image with the BX placeholder.

### Representative expected results

Given an item containing an unowned `7-60` Ratchet and an owned `LR` Bit:

| Filter | Expected result |
| --- | --- |
| Part `LR` | Match. |
| Parts `LR, 7-60`, match all | Match. |
| Part `LR`, Only missing parts | No match. |
| Part `7-60`, type Bit | No match. |

Sorting rules:

- Score is descending.
- Name is ascending.
- Newest added is descending by `createdAt`.
- Price and Cost Index are ascending, with missing, zero, or non-positive values last.

## Catalogue

### User capabilities

- Automatically load the committed sanitized public snapshot; there is no Catalogue upload button.
- Show verified listings of every availability status, not only orderable products.
- Search product name, retailer, included products, and configs.
- Filter by retailer and availability status.
- Sort by recently observed, name, ascending/descending price, retailer, or availability.
- Display image, product link, bundle type, retailer, currency-aware price, status, configs, and last-observed date.

Availability sort order is:

```text
available_now
preorder
delayed
backorder
out_of_stock
unavailable
not_observed
unknown
```

Price sorting places missing prices last. Recently observed sorts newest first and also places missing dates last.

## Rules

- Render rank scores, part-type weights, and rarity multipliers directly from public reference modules.
- Display the Part Score, Cost Contribution, and Cost Index formulas.
- State that a lower Cost Index is better.

## Retailer and Derived-Data Workflows

The React migration must not regress these non-UI workflows:

- Validate local JSON with `npm run validate:data`.
- Summarize private data with `npm run summarize:data`.
- Normalize crawl evidence without guessing unmatched products.
- Audit and gate incomplete normalized listings.
- Generate wishlist from normalized listings, inventory, and ranking/scoring modules.
- Export a sanitized public Catalogue snapshot.
- Keep unavailable normalized listings while excluding ineligible rows from Wishlist.

## Baseline Verification

At Phase 0 completion:

- `npm run validate:data` passes with the existing local private data.
- `npm test` passes.
- `.gitignore` excludes `data/*.local.json`, `data/raw/`, `data/normalized/`, `exports/`, and `*.xlsx`.
- The migration branch is `codex/react-migration`.
- Production remains deployed from `main`; migration-branch pushes do not trigger the Pages workflow.

