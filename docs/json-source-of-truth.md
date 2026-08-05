# JSON Source Of Truth

The project should no longer depend on Excel as the main data store.

## Principle

- JSON is authoritative.
- Excel is legacy output or an optional human-readable report.
- Codex/new agents should manage JSON files directly.
- The static app reads public reference modules and user-uploaded private JSON.

## Public Data

Commit-safe data lives in source modules:

- `src/reference-data/scoringConfig.js`
- `src/reference-data/names.js`
- `src/reference-data/rankings/bbxWeekly.js`
- `src/reference-data/rankings/gamerPost.js`

These files contain scoring rules, aliases, abbreviations, and public ranking references.

## Private Data

Local-only data lives under `data/` and is ignored by Git:

- `data/collection.local.json` (authoritative inventory and purchase history)
- `data/normalized/retailer-listings.local.json`
- `data/wishlist.local.json`
- `data/raw/*.json`

Codex should edit the `inventory` and `purchases` sections of collection JSON directly. Retailer refreshes update normalized listings after preserving raw evidence. Wishlist JSON is derived from normalized listings, collection inventory, and public ranking/scoring modules.

## Retailer Data Pipeline

```text
retailer pages
  -> data/raw/ evidence
  -> data/normalized/retailer-listings.local.json
  -> eligibility + inventory/ranking calculation
  -> data/wishlist.local.json
```

Normalized listings are the catalogue of verified retailer facts and retain unavailable records. Wishlist is the actionable derived view and excludes `out_of_stock`, `unavailable`, `not_observed`, `unknown`, and records with `orderable: false`.

## New Agent Workflow

1. Read `AGENTS.md`.
2. Read `docs/data-contracts.md`.
3. Read `docs/crawl-playbook.md` for refresh work.
4. Inspect existing `data/collection.local.json`, other local JSON, and `data/raw/` if available.
5. Make the requested JSON changes directly.
6. When ownership or purchase history changes, treat collection and wishlist as one transaction:
   - Add or remove the requested row under `collection.purchases.items`.
   - Add or remove the complete bey and all parts supplied by it under `collection.inventory`. Preserve quantities or shared parts that are still owned from another source.
   - Recalculate affected wishlist `usefulParts`, `helpsInventory`, `score`, and `costIndex` against the updated inventory.
   - Keep verified retailer listings after purchase. Fully owned listings use `usefulParts: "-"` and `costIndex: null`; mixed bundles continue scoring only missing useful parts.
7. Run `npm run validate:data`.
8. Run `npm test`.
9. Check `git status --short --untracked-files=all`.
10. Do not stage private JSON files.

Preview and generate the derived wishlist with:

```bash
npm run generate:wishlist -- --dry-run
npm run generate:wishlist
```

For retailer refreshes:

```bash
npm run refresh:wishlist -- --dry-run
npm run refresh:wishlist
```

The refresh command is the normal end-to-end path: it reads every raw capture, safely merges newer observations into stable normalized listing identities, audits the result, and regenerates the wishlist. For inspection or recovery, the individual commands remain available:

```bash
npm run audit:normalized
npm run normalize:crawl -- --dry-run
npm run normalize:crawl
npm run report:candidates
npm run gate:normalized
npm run generate:wishlist -- --dry-run
npm run generate:wishlist
```

`normalize:crawl` merges newer observations only into an existing stable listing identity. Unmatched crawl results are reported as candidates; they require product/config verification before being added to normalized data. `normalizationStatus` other than `verified` is never wishlist-eligible.

## When Excel Appears

If an Excel workbook exists:

- Treat it as historical context or a report.
- Do not update Excel first.
- If a user asks for Excel output, generate/export from JSON.
- If JSON and Excel disagree, prefer JSON unless the user explicitly says the workbook is newer.

## Useful Commands

```bash
npm run validate:data
npm run summarize:data
npm test
```

`validate:data` allows missing private files so public clones can still pass tests.

Legacy installations can combine their old files once with `npm run migrate:collection`. The migration preserves both legacy inputs but active tools use `data/collection.local.json` afterward.
