# Codex Project Instructions

This repo is a static Beyblade X scorebook intended for GitHub Pages. JSON is the source of truth. Public app code and reference data may be committed. Private local data must stay out of Git.

## Privacy

- Do not commit `data/*.local.json`, `data/raw/`, `exports/`, or `*.xlsx`.
- Treat inventory, purchases, wishlist, retailer scrape output, and local workbook exports as private.
- The public app should load private data through browser file upload or browser-local storage only.
- Before every commit, run `git status --short --untracked-files=all` and confirm private files are not staged.

## Crawling And Refreshes

- Keep crawling flexible. Do not hard-code a brittle scraper when browser inspection or a lighter data extraction is safer.
- Prefer Codex-led refreshes using the current site behavior, user browser context, and cautious manual verification.
- Be gentle with retailers. If Amazon, Walmart, or grocery sites show robot/CAPTCHA/blocking behavior, stop aggressive retrying and switch to manual inspection or ask the user.
- Follow `docs/crawl-playbook.md` for sources, fields, status rules, and refresh checklist.
- Follow `docs/data-contracts.md` when writing local JSON.
- Treat Excel files as legacy exports only. Do not use Excel as the primary source of truth for new updates.

## App And Data Rules

- JSON files are authoritative. Codex should read and update `data/*.local.json` directly for private state.
- Default page is `Scorebook`; private pages are `Inventory` and `Wishlist`; `Rules` documents scoring.
- Scoring logic lives in `src/scoring.js`.
- Reference scoring constants live under `src/reference-data/`.
- Keep the static app dependency-light and GitHub Pages-friendly.
- After code or data-shape changes, run `npm test`.
- Use `npm run validate:data` after editing local JSON.
- Use `npm run summarize:data` to inspect local JSON counts without opening the app.

## Commit Checklist

- `npm test`
- `npm run validate:data` when local JSON changed
- `git status --short --untracked-files=all`
- Confirm ignored private files remain ignored.
- Commit public code/docs/reference changes only.
