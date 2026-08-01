# Beyblade X Scorebook

A static Beyblade X scorebook for checking product value, owned inventory, wishlist items, and scoring rules.

The project is designed for GitHub Pages and for Codex-managed local JSON data.

## Current Architecture

JSON is the source of truth.

- Public app and reference data are committed.
- Private local data is ignored by Git and managed as JSON.
- Excel is legacy/export-only context, not primary storage.
- Codex/new agents should read and update JSON directly.

Public data:

- `src/reference-data/`: scoring rules, aliases, public rankings.
- `src/scoring.js`: parser and score/Cost Index logic.
- `index.html`, `src/app.js`, `src/styles.css`: static app.

Private local data:

- `data/inventory.local.json`
- `data/purchases.local.json`
- `data/wishlist.local.json`
- `data/raw/*.json`

These private files are gitignored.

## Pages

- `Scorebook`: product/combo scoring and Cost Index lookup.
- `Inventory`: browser-loaded private inventory JSON.
- `Wishlist`: browser-loaded private wishlist JSON with search and sorting.
- `Rules`: scoring weights, rarity multipliers, and formulas.

## Run Locally

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

No build step is required for GitHub Pages.

## Local Private Data

Copy example files if starting fresh:

```bash
cp data/inventory.local.example.json data/inventory.local.json
cp data/purchases.local.example.json data/purchases.local.json
cp data/wishlist.local.example.json data/wishlist.local.json
```

Files matching these patterns are ignored:

- `data/*.local.json`
- `data/raw/`
- `exports/`
- `*.xlsx`

The app loads private JSON through browser file upload. Uploaded data is stored in browser `localStorage` for convenience and can be cleared with `Clear local data`. It is not uploaded to a server and is not included in GitHub Pages.

## Data Commands

Validate local JSON when private files exist:

```bash
npm run validate:data
```

Print local data counts:

```bash
npm run summarize:data
```

Run app smoke tests plus local data validation:

```bash
npm test
```

Missing private JSON files are allowed so public checkouts can still pass validation.

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
Rank Score * Part Type Weight
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
Price / SUM(Part Score * Rarity Multiplier) * 5
```

Lower Cost Index is better. Owned parts use multiplier `0`, normal missing parts use `1`, and rare missing parts use `1.5`.

## Codex Workflow

For a new Codex session:

1. Read `AGENTS.md`.
2. Read `docs/json-source-of-truth.md`.
3. Read `docs/data-contracts.md`.
4. For listing refreshes, read `docs/crawl-playbook.md`.
5. Inspect `data/*.local.json` and `data/raw/` if available.
6. Edit JSON directly, not Excel.
7. Run `npm run validate:data`.
8. Run `npm test`.
9. Confirm private data is ignored before committing.

Useful docs:

- `AGENTS.md`
- `docs/json-source-of-truth.md`
- `docs/data-contracts.md`
- `docs/crawl-playbook.md`
- `docs/roadmap.md`

## GitHub Pages Privacy Model

The public site contains only committed source files. It cannot and should not automatically read local private JSON from your computer.

Private data becomes visible in the app only after you manually upload it in the browser. Browser `localStorage` keeps it on that device only.

## Commit Safety

Before committing:

```bash
npm test
git status --short --untracked-files=all
git check-ignore -v data/inventory.local.json data/purchases.local.json data/wishlist.local.json data/raw/
```

Commit only public app, docs, scripts, and reference data.
