# GitHub Pages Hosting Notes

This project is a static site and can be hosted as a GitHub Pages project site at:

```text
https://killalau.github.io/beyblade-x-scorebook/
```

The recommended deployment method is a custom GitHub Actions workflow. It can run the tests and publish a deliberately small artifact instead of exposing the entire repository as the Pages source.

## Privacy Boundary

The deployed artifact must contain only public app files. Do not deploy or commit:

- `data/*.local.json`
- `data/normalized/`
- `data/raw/`
- `exports/`
- `*.xlsx`

Inventory and wishlist data remain browser-local. A user manually uploads private JSON in the app, which stores it in that browser's `localStorage`; GitHub Pages does not receive or host it.

## Recommended Workflow

Create `.github/workflows/pages.yml`:

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Test
        run: npm test

      - name: Prepare static site
        run: |
          mkdir -p _site/data
          cp index.html _site/
          cp -R src _site/src
          cp data/retailer-listings.json _site/data/
          touch _site/.nojekyll

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: _site

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

The app already uses relative asset paths such as `./src/styles.css` and `./src/app.js`, so it should work under the `/beyblade-x-scorebook/` project-site path without a `<base>` element or build-time base URL.

## Repository Setup

After committing and pushing the workflow:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab and monitor the `Deploy GitHub Pages` workflow.
5. When it completes, open the URL reported by the `github-pages` deployment environment.

GitHub's current Pages documentation:

- [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages site types and default URLs](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

## First Deployment Checklist

Verify the public site in a clean/incognito browser:

- `index.html`, CSS, and JavaScript modules load without 404 errors.
- Scorebook calculations and the Rules page work without private files.
- Inventory JSON can be uploaded and rendered.
- Wishlist JSON can be uploaded and rendered.
- Wishlist thumbnails, card/list views, sorting, and part filters work.
- Part filters correctly match examples such as `LR` and `7-60`.
- Reloading preserves uploaded data and filter state in that browser's `localStorage`.
- `Clear local data` removes the browser-local private state.
- Mobile layout remains usable.
- The deployed artifact does not expose private JSON or raw crawl captures.

## Normal Release Flow

After Pages is enabled, each push to `main` will run tests and deploy automatically:

```bash
npm run validate:data
npm test
git status --short --untracked-files=all
git push origin main
```

Before every commit, confirm ignored private files are not staged. Local data validation may inspect private files on the development machine, but the GitHub runner will not have those files and the validator allows them to be absent.

## Troubleshooting

- **404 for the whole site:** confirm Pages Source is set to GitHub Actions and inspect the deployment workflow.
- **CSS or JavaScript 404:** preserve the current relative `./src/...` paths and confirm `src/` is included in `_site`.
- **Workflow cannot deploy:** confirm the workflow has `pages: write` and `id-token: write`, and uses the `github-pages` environment.
- **Tests fail in Actions:** reproduce with `npm test` locally and confirm the workflow uses a supported Node version.
- **Private data appears missing:** this is expected on a new browser or device; upload the local inventory/wishlist JSON again.
- **Private data appears in Git:** stop deployment, remove it from Git history if necessary, and rotate any exposed secrets. Gitignore alone does not remove files already committed.

## Optional Later Work

- Configure a custom domain in **Settings → Pages** and enable HTTPS.
- Add a deployment-status badge to `README.md`.
- Add deployment protection so only `main` can deploy to the `github-pages` environment.
- Add automated link or browser smoke checks against the deployed URL.
