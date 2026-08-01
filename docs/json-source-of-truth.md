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

- `data/inventory.local.json`
- `data/purchases.local.json`
- `data/wishlist.local.json`
- `data/raw/*.json`

Codex should edit these JSON files directly when managing inventory, purchase history, wishlist, or retailer refreshes.

## New Agent Workflow

1. Read `AGENTS.md`.
2. Read `docs/data-contracts.md`.
3. Read `docs/crawl-playbook.md` for refresh work.
4. Inspect existing `data/*.local.json` and `data/raw/` if available.
5. Make the requested JSON changes directly.
6. Run `npm run validate:data`.
7. Run `npm test`.
8. Check `git status --short --untracked-files=all`.
9. Do not stage private JSON files.

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
