# Beyblade X Scorebook

A small static score lookup page for Beyblade X parts and product combos.

The repo is designed for GitHub Pages:

- Public: scoring rules, reference rankings, and the static lookup app.
- Private/local only: inventory, purchase prices, wishlists, retailer scrape data, and Excel exports.

## Run Locally

```bash
npm run dev
```

Then open `http://localhost:5173`.

## Private Data

Copy the examples if you want local private data:

```bash
cp data/inventory.local.example.json data/inventory.local.json
cp data/purchases.local.example.json data/purchases.local.json
cp data/wishlist.local.example.json data/wishlist.local.json
```

Files matching `data/*.local.json`, `data/raw/`, `exports/`, and `*.xlsx` are gitignored.

The page can also load an inventory JSON file directly in the browser. It is not uploaded anywhere.

## Scoring Summary

Rank scores:

- `S`: 5
- `A+`: 4
- `A`: 3
- `A-`: 2
- `B+`: 1
- everything else: 0

Part score:

```text
rank score * part type weight
```

Part type weights:

- blade: `1.5`
- ratchet: `1`
- bit: `1`
- lock chip: `1`
- over blade: `0.5`
- assist blade: `0.5`

Cost Index:

```text
price / SUM(part score * rarity multiplier) * 5
```

Lower Cost Index is better. Owned parts use multiplier `0`, normal missing parts use `1`, and rare missing parts use `1.5`.
