# Reference Data Sources

This document records useful external databases that may support future normalization, part provenance, and product-content verification. These are reference sources, not automatically authoritative inputs to retailer availability or pricing.

## BEYBLADE X 戰鬥陀螺瀏覽器

- URL: [https://beyblade.phstudy.org/index.html](https://beyblade.phstudy.org/index.html)
- Added to this project: 2026-08-04
- Intended future use: trace a Blade, Ratchet, Bit, Lock Chip, Main Blade, Assist Blade, or other part back to the product or products that supplied it.
- Current integration status: documented only; not imported, crawled, or used automatically by scoring/wishlist generation.

### Observed capabilities

The site presents a searchable Beyblade X catalogue and parts database with:

- Product/system filters including BX, UX, CX, reissues, limited products, and other series.
- Part-category filters including Blade, Ratchet, Bit, Lock Chip, Main Blade, Over Blade, Metal Blade, and Assist Blade.
- Search by name or product number.
- Multiple comma-separated search conditions, quoted exact matching, and `?` as a single-character wildcard.
- Hasbro, Takara Tomy-only, and combined views.
- Release-date and sales-region information.
- Icon and table views.
- Links or references to product-page snapshots, product pages, introduction videos, and manuals where available.
- A local warehouse/inventory feature, which is outside this project's current data workflow.

### Suitable uses

- Find which products include a requested part such as `LR`, `R`, or `7-60`.
- Verify the remaining contents of a multipack or battle set when a retailer title lists only part of the configuration.
- Map Hasbro and Takara Tomy product naming or regional releases.
- Recover product numbers, release dates, and likely source products for normalized catalogue research.
- Cross-check part type and CX component structure before updating aliases or parser rules.

### Usage rules

- Treat it as a community/reference database and cross-check important facts against official product pages, packaging, manuals, or reliable retailer pages when possible.
- Do not use it as evidence that a product is currently in stock, orderable, or available at a particular Canadian price.
- Preserve the distinction between a product definition and a retailer listing. The reference database may identify what a product contains; Amazon/Walmart/etc. remain the source for listing identity, seller, price, and availability.
- When it supplies a material normalization fact, record the page URL, lookup date, queried part/product, result, and any uncertainty in notes or a dated raw research capture.
- Do not bulk scrape or mirror the database without first checking site behavior, terms, and technical impact. Prefer focused manual/browser lookups.
- Do not automatically overwrite existing normalized configurations from a single external match; compare product number, region, brand, and edition first.

### Possible future integration

A future provenance layer could store relationships independently from retailer listings:

```json
{
  "part": "LR",
  "type": "bit",
  "sourceProducts": [
    {
      "productName": "Example Product",
      "productNumber": "Example number",
      "brand": "Hasbro or Takara Tomy",
      "region": "Example region",
      "sourceUrl": "https://beyblade.phstudy.org/index.html",
      "verifiedAt": "YYYY-MM-DD"
    }
  ]
}
```

If implemented, this should be a separate public or private reference dataset with an explicit contract. It should not be embedded directly into inventory, purchases, raw retailer observations, or the derived wishlist.

## BeybladeHub Parts Database

- URL: [https://beybladehub.app/parts/bits](https://beybladehub.app/parts/bits)
- Current use: focused terminology and part-structure cross-checks.
- Example: the database identifies `Tr` and `Op` as Fused Bits, meaning the Ratchet and Bit are integrated into one part.

Use the same cross-checking rules described above. Community databases can improve normalization but should not independently determine Canadian retailer availability.
