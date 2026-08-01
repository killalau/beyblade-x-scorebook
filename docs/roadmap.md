# Roadmap Notes

These are useful next steps after the data import UX and scoring transparency work.

## Inventory Insights

- Show duplicate part counts.
- Highlight owned top-tier parts.
- List missing high-value parts.
- Suggest build candidates from owned parts.
- Summarize purchase stats: total spend, tax, source, and average item cost.

## Wishlist Decision Support

- Add filters for retailer, listing status, score range, and Cost Index range.
- Hide products where every useful scored part is already owned.
- Compare selected wishlist items side by side.
- Explain why an item is recommended from its part score breakdown.
- Group duplicate products across retailers.

## GitHub Pages Readiness

- Add README deployment instructions.
- Add a GitHub Actions smoke test.
- Check relative paths under a GitHub Pages repository URL.
- Keep a clear privacy note: local JSON is browser-only and not committed.

## Data Model Hardening

- Add JSON schemas for inventory, wishlist, purchases, and rankings.
- Separate Hasbro aliases, Takara Tomy names, abbreviations, and CX parsing rules.
- Expand unit tests for dual packs, battle sets, CX, non-CX, owned parts, rare parts, and zero-score products.
