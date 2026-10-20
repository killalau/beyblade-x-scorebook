# Reference Data Sources

This document records useful external databases that may support future normalization, part provenance, and product-content verification. These are reference sources, not automatically authoritative inputs to retailer availability or pricing.

## BEYBLADE X 戰鬥陀螺瀏覽器

- URL: [https://beyblade.phstudy.org/index.html](https://beyblade.phstudy.org/index.html)
- Added to this project: 2026-08-04
- Intended future use: trace a Blade, Ratchet, Bit, Lock Chip, Main Blade, Assist Blade, or other part back to the product or products that supplied it.
- Current integration status: used by the committed part-image registry for thumbnail and direct-detail links, and by the opt-in `npm run sync:part-names` command to refresh localized names in the private collection. It is not used by scoring or wishlist generation.

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

### Direct links and identifier scope

The site publishes localized static detail pages for component parts using this shape:

```text
https://beyblade.phstudy.org/p/{locale}/{category}/{component-id}.html
```

The Inventory UI currently uses `zh-HK`. Examples include:

- Hasbro Blade: `HB-G4568-BLADE`
- Takara Tomy Main Blade: `MB-PRD-096177-02`
- Takara Tomy Metal Blade uses the `ME-PRD` prefix, not `MT-PRD`.

These full component IDs are phstudy identifiers, not universal SKUs:

- In a Hasbro ID, `G4568` is the manufacturer-specific product/SKU/MPN used for that release. The `HB-` namespace and component suffix such as `-BLADE` are added to identify a phstudy component record.
- On Takara Tomy pages, the official release code (for example `BXG-24`) is separate from the site's `SR/BL/RC/BT-PRD-...` record IDs. A numeric `PRD` core may correspond closely to digits from a JAN for some products, but the prefixed component ID and its variant suffix are not themselves a JAN/GTIN.
- A SKU or manufacturer part number is brand-specific. A GTIN/UPC/EAN/JAN is the appropriate product-level identifier when cross-retailer barcode identity is required.

Accordingly, private inventory should keep the verified brand and useful release/variant code, but should not duplicate phstudy component IDs or detail URLs. The committed image registry derives those source-specific values. If a future provenance registry needs to retain them, store them explicitly as `source: "beyblade.phstudy.org"` plus `externalId`, alongside—not instead of—official product codes and any verified GTIN.

The static sitemap currently exposes component-detail pages for Blade, Ratchet, Bit, Lock Chip, Main Blade, Over Blade, Metal Blade, and Assist Blade. Accessories such as launchers, stadiums, and grips should link to their exact source-product `Series` page where possible; if no unambiguous source-product page exists, use a search URL prefilled with the release ID rather than the unfiltered index.

### Localized-name data

The site publishes locale-specific static JSON for `main`, `hardcoded`, and `hasbro`, plus `part_code_names.json`. The focused name-sync command reads the `en-US`, `zh-TW`, and `zh-HK` variants and joins equivalent TT/Hasbro component records by part category and `group_id`.

- Hasbro English is stored as `names["en-US"]`.
- Takara Tomy English is stored as `names["en-JP"]`; this project key means “TT English”, not Japanese-script text.
- Taiwan and Hong Kong values are stored independently as `names["zh-TW"]` and `names["zh-HK"]`.
- Some Hong Kong component records intentionally expose only the international abbreviation, such as `LF`, rather than a translated phrase. Preserve that source value instead of substituting the Taiwan term.
- Missing equivalents remain `null`; do not manufacture regional translations.
- Exact release/image mappings select colour variants. For a CX Main Blade record whose database label combines the Over Blade and Main Blade as `O/Whip`, persist the Main Blade portion (`Whip`) because the inventory stores those components separately.

The canonical display name is TT English first, then Hasbro English. The other regional names remain searchable without being joined into a slash-delimited display label.

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
