# Codex Project Instructions

This repo is a static Beyblade X scorebook intended for GitHub Pages. JSON is the source of truth. Public app code and reference data may be committed. Private local data must stay out of Git.

## Privacy

- Do not commit `data/*.local.json`, `data/raw/`, `data/normalized/`, `exports/`, or `*.xlsx`.
- Treat collection (inventory plus purchases), wishlist, retailer scrape output, and local workbook exports as private.
- The public app should load private data through browser file upload or browser-local storage only.
- Before every commit, run `git status --short --untracked-files=all` and confirm private files are not staged.

## Crawling And Refreshes

- Keep crawling flexible. Do not hard-code a brittle scraper when browser inspection or a lighter data extraction is safer.
- Prefer Codex-led refreshes using the current site behavior, user browser context, and cautious manual verification.
- For Amazon refreshes, follow the Featured-first search workflow in `docs/crawl-playbook.md`; do not rely on Newest arrivals alone.
- A completed retailer refresh must update raw crawl evidence, `data/normalized/retailer-listings.local.json`, the generated `data/wishlist.local.json`, and the sanitized `data/retailer-listings.json` public snapshot; raw-only refreshes are incomplete unless the source was blocked or the captured data could not be normalized reliably.
- Be gentle with retailers. If Amazon, Walmart, or grocery sites show robot/CAPTCHA/blocking behavior, stop aggressive retrying and switch to manual inspection or ask the user.
- Follow `docs/crawl-playbook.md` for sources, fields, status rules, and refresh checklist.
- Follow `docs/data-contracts.md` when writing local JSON.
- Treat Excel files as legacy exports only. Do not use Excel as the primary source of truth for new updates.

## App And Data Rules

- JSON files are authoritative. Codex should read and update `data/*.local.json` directly for private state.
- `data/collection.local.json` is the authoritative owned-state file. Its `inventory` and `purchases` sections must be updated together when a purchase changes ownership. The former `inventory.local.json` and `purchases.local.json` files are legacy migration inputs only.
- Normalized retailer facts live in `data/normalized/retailer-listings.local.json` and include available, delayed, backorder, out-of-stock, unavailable, not-observed, and unknown listings. Do not delete normalized listings merely because they are not currently purchasable.
- `data/retailer-listings.json` is a generated, sanitized public snapshot for the Catalogue page, not a source of truth. Build it with `npm run export:catalogue`; include verified listings of every availability status and exclude private notes, raw availability text, location, and session context.
- `data/wishlist.local.json` is derived from normalized listings, inventory, and public ranking/scoring modules. Generate it with `npm run generate:wishlist`; out-of-stock, unavailable, not-observed, unknown, or non-orderable listings must be excluded from the generated wishlist.
- Treat collection and wishlist as synchronized private state. After any ownership or purchase change, update both collection sections in the same task: add/remove the requested purchase row, add/remove the complete bey and its parts in inventory, then regenerate wishlist `usefulParts`, `helpsInventory`, `score`, and `costIndex`.
- For returns, preserve the purchase row, record the returned product and refund in `returnedItems`, remove the returned product and parts from current inventory, and regenerate the wishlist. Net total spend subtracts `returnedItems[].refundAmount`.
- When adding an inventory product or purchase, find and store a reliable product thumbnail in `purchases.items[].imageUrl`, then verify that the Inventory card has an image. If no trustworthy image is available, say so explicitly instead of silently leaving it blank.
- This is a Canadian collection, so treat an unspecified owned product as Hasbro when that exact product/release exists in Hasbro's catalogue. Use Takara Tomy only when the user identifies it as TT or no Hasbro catalogue release exists; preserve explicit evidence and never infer a colour variant from brand alone.
- Record the verified release brand explicitly on every purchase and owned part: `purchases.items[].brand` and `inventory.partsDetail[].brand` must be either `Hasbro` or `Takara Tomy`. The Canadian default helps verify new records but is not a substitute for the per-record fact; do not infer brand from retailer or country alone.
- Keep launcher types distinct: Hasbro's small starter launcher with ripcord is `Entry Launcher`, not `Winder Launcher`. Use `Winder Launcher`, `Long Winder Launcher`, or `String Launcher` only when the exact product contents verify that type.
- Inventory part categories are fixed by `src/inventory-parts.js` and documented in `docs/data-contracts.md`. Do not introduce a new persisted category without asking the user to confirm that the category list should be expanded.
- Keep verified retailer listings in normalized data after purchase. If the listing remains eligible, a fully owned wishlist row uses `usefulParts: "-"` and `costIndex: null`; mixed bundles continue scoring only missing ranked parts.
- Default page is `Scorebook`; private pages are `Inventory` and `Wishlist`; `Rules` documents scoring.
- The production UI is the React/TypeScript/Vite application rooted at `index.html` and `src/main.tsx`. Do not reintroduce the retired vanilla DOM application.
- Production routing uses `HashRouter`, and Vite's production base is `/beyblade-x-scorebook/` for GitHub Pages.
- `.github/workflows/pages.yml` builds and deploys only `dist/`; never copy the repository tree directly into a Pages artifact.
- Scoring logic lives in `src/scoring.js`.
- Reference scoring constants live under `src/reference-data/`.
- Keep the static app dependency-light and GitHub Pages-friendly.
- After code or data-shape changes, run `npm test`.
- Use `npm run validate:data` after editing local JSON.
- Use `npm run summarize:data` to inspect local JSON counts without opening the app.
- Use `npm run generate:wishlist -- --dry-run` to preview eligibility and scoring changes before writing the derived wishlist.
- Use `npm run audit:normalized` to find missing IDs/timestamps/images/configs, suspicious listings, unknown statuses, and review-required rows.
- Use `npm run normalize:crawl -- --dry-run` before merging raw observations. Existing stable listing IDs may receive newer retailer facts; unmatched candidates must remain review-only and must not enter the generated wishlist until their product contents are verified.
- Use `npm run refresh:wishlist -- --dry-run` to preview the complete deterministic raw-to-wishlist pipeline, then `npm run refresh:wishlist` to write normalized data and the derived wishlist in one operation.
- Use `npm run report:candidates` for unmatched crawl observations. Use `npm run gate:normalized` after reviewing audit findings to keep suspicious or incomplete rows in normalized history while excluding them from wishlist eligibility.

## Commit Checklist

- `npm run validate:data` when local JSON changed
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run build`
- `npm run check:build`
- `npm run test:e2e` for UI, routing, storage, build, or deployment changes
- `git status --short --untracked-files=all`
- Confirm ignored private files remain ignored.
- Commit public code/docs/reference changes only.
