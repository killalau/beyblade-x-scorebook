# Crawl Playbook

This playbook records how Codex should refresh retailer data while staying flexible. It is not a requirement to use one fixed crawler.

## Sources

- Amazon.ca Beyblade X store/search/product pages.
- Walmart.ca Beyblade X search/product pages.
- Real Canadian Superstore search/product pages when useful.
- Other Canadian retailers may be added after confirming the source is relevant and safe to inspect.

Product/part reference databases are documented separately in [`docs/reference-sources.md`](reference-sources.md). They may help verify product contents and part provenance, but they are not retailer sources for Canadian price or availability.

## Crawl Posture

- Prefer the lightest reliable method for the current site state.
- Use browser inspection when the page depends on user location, pickup settings, login/session state, or dynamic availability.
- Avoid aggressive retries, high concurrency, and behavior that looks automated to retailer sites.
- If blocked by robot/CAPTCHA/interstitial pages, pause. Do not fight the block. Use manual inspection, slower browser navigation, or ask the user.
- Record source URL and collection date for every listing.

## Amazon Search Workflow

Amazon's `Newest arrivals` sort is not a reliable list of the newest official Beyblade products. It can place newly created third-party tops, accessories, storage cases, and unrelated marketplace listings ahead of genuine Hasbro or Takara Tomy products.

- Use the default `Featured` / Best Match search as the primary Amazon discovery surface.
- Inspect at least the first Featured results page. For a fuller refresh, inspect the second Featured page too.
- Use `Newest arrivals` only as a supplemental pass; never use it alone to decide whether the wishlist is current.
- On Featured results, compare the ASINs of prominent genuine Hasbro, Beyblade, and Takara Tomy listings against the existing raw data and wishlist.
- Treat result position as a temporary observation, not a stable identifier. Ranking varies with location, session, personalization, sponsored cards, and page layout.
- Use the ASIN as the stable identity and store a canonical URL such as `https://www.amazon.ca/dp/ASIN` when possible.
- Open every newly discovered ASIN's product page to verify title, included products/configs, price, seller, availability, and delivery text before normalizing it into the wishlist.
- If the number of extracted product cards is materially lower than the result count or visible page content, treat the capture as incomplete and perform browser-visible/manual verification.
- When a user supplies an Amazon wishlist or tracking URL, extract its ASIN, inspect the direct product page, and store the canonical `/dp/ASIN` URL rather than the tracking parameters.
- In the refresh summary, state which Featured and Newest pages were inspected and disclose any extraction, personalization, location, or blocking uncertainty.

Observed example (2026-08-01): the Featured search placed the genuine Amazon-exclusive Rival Rumble Pack (`B0GP22FMHL`) at the front of the official results, while it did not appear among the first 15 extracted Newest-arrivals products. The first five Newest results were generic third-party tops or accessories. This is why Featured is the primary pass.

## Fields To Collect

For each product/listing, collect as many of these as reliable:

- `name`: friendly product name.
- `retailer`: Amazon, Walmart, Real Canadian Superstore, etc.
- `price`: CAD number where available.
- `status`: in stock, preorder, restock date, out of stock, unavailable, or unknown.
- `availabilityText`: exact nearby text used to infer status.
- `seller`: seller or marketplace merchant.
- `fulfillment`: delivery, pickup, shipped by, or availability text.
- `url`: canonical product URL.
- `imageUrl`: first reliable product image/thumbnail URL from the verified listing page.
- `createdAt`: ISO timestamp set when a listing is first added to the wishlist and preserved on later refreshes.
- `bundleType`: booster, starter, dual pack, battle set, stadium, launcher, part set, etc.
- `includedBeys`: English names, comma-separated for multi-packs.
- `configs`: configs, comma-separated inside one product row.
- `usefulParts`: notable scored parts or beys.
- `notes`: uncertainty, assumptions, source quirks.

## Availability Rules

- Treat in-stock/add-to-cart items as valid wishlist candidates.
- Treat preorder as valid status, not unavailable.
- For Walmart-style delivery dates:
  - Delivery within 7 days counts as available now.
  - Delivery after 7 days should be recorded as restock/delayed with the date.
  - Preorder stays preorder even if a date is shown.
- If date text is ambiguous, preserve the raw `availabilityText` and set status to unknown or delayed.

## Bundle And Config Rules

- One wishlist row equals one product/listing.
- If a product contains more than one bey, keep it as one product and comma-separate configs.
- Example: `Gill Shark 4-70O, Pearl Tiger 3-60U`.
- Do not split a dual pack or battle set into separate products unless each has its own separate price/listing.
- CX parsing is row-level in the app. If a mixed normal/CX product appears, note the limitation and preserve raw configs.

## Refresh Workflow

1. Read `AGENTS.md`, this playbook, and `docs/data-contracts.md`.
2. Check current git status.
3. Inspect existing private local files under `data/*.local.json` and `data/raw/` if available.
4. Refresh retailer listings with cautious browser/network behavior. For Amazon, run the Featured-first workflow above and use Newest only as a supplemental pass.
5. Preserve the source evidence in a dated file under `data/raw/`, including source URL, collection timestamp, raw title, raw price/availability text, and product ID where available.
6. Preview the complete merge/audit/generate flow with `npm run refresh:wishlist -- --dry-run`, inspect updated/stale/candidate/audit and wishlist counts, then run `npm run refresh:wishlist`. Use `npm run report:candidates` and the individual `normalize:crawl`, `audit:normalized`, `gate:normalized`, and `generate:wishlist` commands when review or intervention is needed. Unmatched candidates require product/config verification; do not promote them automatically. Normalized catalogue data includes unavailable and out-of-stock listings. A raw-only refresh is incomplete unless the source was blocked or the captured data was too uncertain to normalize safely; document that exception explicitly.
7. Reconcile normalized rows by stable listing identity (ASIN, retailer product ID, or canonical URL):
   - Add newly verified listings.
   - Update price, seller, fulfillment, availability text, status, delivery/restock date, canonical URL, and notes for existing listings.
   - Capture the first reliable product image as `imageUrl` when available. Do not fabricate image URLs; preserve the existing value when a refresh cannot obtain a replacement.
   - Set normalized `firstSeenAt` only when first adding a listing. Preserve it on later refreshes; update `lastSeenAt` and `lastAvailableAt` independently.
   - Do not put derived `usefulParts`, `helpsInventory`, `score`, or `costIndex` in normalized retailer facts.
   - Keep one row per retailer listing. The same product sold by different retailers remains separate rows.
   - Mark a previously known listing `out of stock`, `unavailable`, `unknown`, or `not observed` when supported by the refresh; do not delete it merely because it disappeared from one search page.
   - Keep multipacks and battle sets as one product row with comma-separated included beys/configs.
8. Confirm that every newly normalized listing can be traced to a raw record from the same refresh. Report any raw records intentionally excluded as irrelevant, counterfeit/third-party, ambiguous, or duplicate.
9. Review the audit from `refresh:wishlist`; resolve material issues introduced by this refresh. If audit findings require a catalogue-wide eligibility pass, run `npm run gate:normalized` and rerun `npm run refresh:wishlist`. The eligibility filter requires `normalizationStatus: "verified"`; it excludes out-of-stock, unavailable, not-observed, unknown, and non-orderable records, while retaining available, preorder, delayed/restock, and orderable backorder records.
10. Update both `inventory` and `purchases` sections of `data/collection.local.json` only when the user says they bought or own something, then regenerate wishlist. Keep verified retailer listings in normalized data after purchase; fully owned wishlist rows use `usefulParts: "-"` and `costIndex: null`, while mixed bundles score only missing ranked parts.
11. Run `npm run validate:data`.
12. Run `npm run export:catalogue -- --dry-run`, inspect the count, then run `npm run export:catalogue`. The public snapshot contains all verified normalized listings regardless of availability, but strips private notes and raw availability/location context.
13. Run `npm run summarize:data` and review normalized, eligible, excluded, and wishlist count changes.
14. Run `npm test`.
15. Verify private JSON/raw files are ignored and not staged.
16. Summarize raw captures, normalized catalogue additions/updates, wishlist eligibility changes, excluded results, uncertainty, and any blocked sources.

## Human Verification

Ask the user or manually verify in browser when:

- Status is location-specific.
- Page is blocked or asks for verification.
- Product title is ambiguous or SEO-heavy.
- A Hasbro product maps uncertainly to Takara Tomy naming.
- A battle set or multipack image implies included beys not stated in text.
