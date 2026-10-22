# Beyblade X Scorebook

A static React application for Beyblade X scoring, owned parts, purchase history, wishlist decisions, and retailer catalogue browsing.

[Open the live Beyblade X Scorebook](https://killalau.github.io/beyblade-x-scorebook/)

## Architecture

JSON is the source of truth. The application uses React, TypeScript, Vite, Tailwind CSS, selective shadcn-compatible/Radix primitives, TanStack Table, and Zod. It is built into `dist/` and deployed to GitHub Pages by GitHub Actions.

- Public scoring and reference data live under `src/reference-data/`.
- Public Catalogue data is the sanitized `data/retailer-listings.json` snapshot.
- Private collection and wishlist JSON remain ignored by Git.
- Private data enters the site only through browser file upload and stays in browser `localStorage`.
- Retailer crawling, normalization, wishlist generation, and catalogue export remain Node scripts outside the UI.

See [React Architecture](docs/react-architecture.md) for the component, data-flow, privacy, and deployment boundaries.

## Pages

- `Scorebook`: product/combo scoring and Cost Index lookup.
- `Inventory`: owned-parts tabs, grouping, quantities, sources, and line information.
- `Purchase`: current owned products, trade history with transferred cost basis and cash adjustments, purchase history, disposal events, and net spend.
- `Wishlist`: private derived wishlist with card/list views, sorting, and part filters.
- `Catalogue`: public sanitized retailer listings of every availability status.
- `Rules`: scoring weights, rarity multipliers, and formulas.

## Run Locally

Install dependencies and start Vite:

```bash
npm ci
npm run dev
```

Open `http://localhost:5173/`.

Build and inspect the GitHub Pages form of the site:

```bash
npm run build
node scripts/serve-react-build.mjs
```

Open `http://127.0.0.1:4173/beyblade-x-scorebook/`.

## Quality Commands

```bash
npm run validate:data
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run check:build
npm run test:e2e
npm run test:mutation
```

`test:e2e` requires Playwright Chromium. Install it once with `npm run test:e2e:install`. Mutation testing is targeted at high-value pure domain modules and is not required for every styling or documentation change.

## Local Private Data

Copy the examples when starting fresh:

```bash
cp data/collection.local.example.json data/collection.local.json
cp data/wishlist.local.example.json data/wishlist.local.json
```

Private files include:

- `data/collection.local.json`
- `data/wishlist.local.json`
- `data/normalized/`
- `data/raw/`
- `exports/`
- `*.xlsx`

The app cannot read these files automatically. Upload collection and wishlist JSON in the browser; `Clear data` removes the saved browser copies. Nothing is uploaded to a server.

## Data Commands

```bash
npm run summarize:data
npm run normalize:crawl -- --dry-run
npm run audit:normalized
npm run gate:normalized
npm run refresh:wishlist -- --dry-run
npm run refresh:wishlist
npm run export:catalogue
```

Read [JSON Source of Truth](docs/json-source-of-truth.md), [Data Contracts](docs/data-contracts.md), and the [Crawl Playbook](docs/crawl-playbook.md) before changing data.

## Scoring Summary

Part score is `Rank Score × Part Type Weight`. Cost Index is `Price ÷ SUM(Part Score × Rarity Multiplier) × 5`; lower is better. Owned parts contribute zero, normal missing parts use `1`, and rare missing parts use `1.5`.

## Deployment

Every push to `main` runs the complete validation, test, build, privacy, and Playwright suite before deploying `dist/` to GitHub Pages. See [GitHub Pages Hosting Notes](docs/github-pages-hosting.md).

Before every commit, check that private files are still ignored and unstaged:

```bash
git status --short --untracked-files=all
git check-ignore -v data/collection.local.json data/wishlist.local.json data/raw/
```
