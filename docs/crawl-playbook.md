# Crawl Playbook

This playbook records how Codex should refresh retailer data while staying flexible. It is not a requirement to use one fixed crawler.

## Sources

- Amazon.ca Beyblade X store/search/product pages.
- Walmart.ca Beyblade X search/product pages.
- Real Canadian Superstore search/product pages when useful.
- Other Canadian retailers may be added after confirming the source is relevant and safe to inspect.

## Crawl Posture

- Prefer the lightest reliable method for the current site state.
- Use browser inspection when the page depends on user location, pickup settings, login/session state, or dynamic availability.
- Avoid aggressive retries, high concurrency, and behavior that looks automated to retailer sites.
- If blocked by robot/CAPTCHA/interstitial pages, pause. Do not fight the block. Use manual inspection, slower browser navigation, or ask the user.
- Record source URL and collection date for every listing.

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
4. Refresh retailer listings with cautious browser/network behavior.
5. Normalize listings directly into `data/wishlist.local.json` shape. JSON is the source of truth.
6. Preserve raw source captures in `data/raw/` when useful.
7. Update inventory/purchase JSON directly only when the user says they bought or own something.
8. Run `npm run validate:data`.
9. Run `npm test`.
10. Verify private JSON/raw files are ignored and not staged.
11. Summarize what changed, uncertainty, and any blocked sources.

## Human Verification

Ask the user or manually verify in browser when:

- Status is location-specific.
- Page is blocked or asks for verification.
- Product title is ambiguous or SEO-heavy.
- A Hasbro product maps uncertainly to Takara Tomy naming.
- A battle set or multipack image implies included beys not stated in text.
