# GitHub Pages Hosting

The production React application is published at:

```text
https://killalau.github.io/beyblade-x-scorebook/
```

## Deployment Model

`.github/workflows/pages.yml` is the only production deployment path. A push to `main`, or a manual workflow dispatch, performs these steps:

1. Install the locked npm dependencies.
2. Validate data and run unit/component/smoke tests.
3. Run TypeScript, ESLint, and Prettier checks.
4. Build the Vite application with the `/beyblade-x-scorebook/` base path.
5. Inspect `dist/` for private or disallowed data.
6. Run Playwright E2E and accessibility tests against the production build.
7. Upload only `dist/` as the Pages artifact and deploy it.

The site uses `HashRouter`, so page routes such as `#/inventory` work without server rewrites.

## Privacy Boundary

The deployment artifact may contain public application assets, scoring/reference modules bundled by Vite, and `data/retailer-listings.json`. It must not contain:

- `data/*.local.json`
- `data/normalized/`
- `data/raw/`
- `exports/`
- `*.xlsx`

Collection and wishlist data enter the site only through browser file upload. They remain in that browser's `localStorage`; GitHub Pages never receives them. `npm run check:build` enforces the artifact boundary before deployment.

## Local Production Check

```bash
npm ci
npm run build
npm run check:build
node scripts/serve-react-build.mjs
```

Open `http://127.0.0.1:4173/beyblade-x-scorebook/`. The custom server intentionally reproduces the repository base path used by GitHub Pages.

Run browser coverage with:

```bash
npm run test:e2e:install
npm run test:e2e
```

## Release Checklist

- All local quality commands pass.
- Private JSON, normalized data, raw captures, exports, and workbooks are ignored and unstaged.
- The `Deploy GitHub Pages` workflow completes successfully.
- The deployment environment reports the expected Pages URL.
- The live root loads the React application without asset or console errors.
- Scorebook and Rules work without private files.
- Catalogue loads the public snapshot.
- Collection and wishlist uploads render correctly and survive reload in that browser.
- `Clear data` removes browser-stored private state.
- Mobile navigation remains usable.

## Repository Setting

In **Settings → Pages**, **Build and deployment → Source** must be **GitHub Actions**. The workflow needs `pages: write` and `id-token: write`, and deploys through the `github-pages` environment.

## Troubleshooting

- **Whole-site 404:** confirm Pages uses GitHub Actions and inspect the deploy job.
- **Asset 404:** confirm Vite still uses `/beyblade-x-scorebook/` as its production base.
- **Catalogue unavailable:** confirm `dist/data/retailer-listings.json` exists and passed its Zod contract.
- **Private data missing on a new device:** expected; upload the local JSON again.
- **Private data found in a build or commit:** stop deployment and remove the exposed data from Git history; `.gitignore` does not protect already tracked files.

Official references:

- [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
