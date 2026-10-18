# React Application Architecture

## Runtime Shape

The Scorebook is a static single-page application. Vite builds `index.html` and the React/TypeScript source into `dist/`; GitHub Pages serves that output under `/beyblade-x-scorebook/`. `HashRouter` owns the six page routes without requiring server-side fallback rules.

`src/main.tsx` composes the application providers:

```text
HashRouter
└── PrivateDataProvider
    └── PublicCatalogueProvider
        └── App / AppShell / lazy page routes
```

Pages are lazy-loaded. Shared controls and design primitives live under `src/components/`; page-specific orchestration lives under `src/pages/`; pure behavior belongs in domain or feature modules.

## Data Boundaries

| Data | Authority | Browser behavior | Public build |
| --- | --- | --- | --- |
| Collection and purchases | `data/collection.local.json` | Manual upload, Zod validation, `localStorage` | Never included |
| Wishlist | `data/wishlist.local.json` | Manual upload, Zod validation, `localStorage` | Never included |
| Normalized retailer facts | `data/normalized/retailer-listings.local.json` | Used by Node generation scripts | Never included |
| Raw crawl evidence | `data/raw/` | Used by normalization/audit scripts | Never included |
| Catalogue | `data/retailer-listings.json` | Fetched automatically and Zod-validated | Included |
| Scoring/rankings | `src/reference-data/` | Bundled with the application | Included |

Zod schemas in `src/schemas/data-schemas.ts` protect browser inputs. Node validation remains dependency-light in `scripts/validate-local-data.mjs`; parity tests keep the contracts aligned.

## Domain Logic

Scoring, inventory grouping, purchase calculations, listing sorting, and wishlist filters are pure modules shared with scripts where practical. Vitest protects their behavior, while the targeted Stryker configuration measures whether the high-value tests detect meaningful mutations.

Retailer crawling and derived-data generation do not run in the browser. They remain explicit Node workflows that update local normalized data, generate the private wishlist, and export the sanitized public Catalogue.

## UI and State

- React Context plus local state handles collection, wishlist, Catalogue, and page interactions.
- Private collection/wishlist state persists only in browser `localStorage`.
- TanStack Table supplies table models; responsive cards preserve mobile usability.
- Tailwind CSS and locally owned shadcn-compatible primitives provide styling and interaction consistency.
- Radix Tabs supplies keyboard-correct inventory navigation.
- No backend, authentication, analytics, or cloud synchronization is present.

## Verification Layers

1. Data validation and Node smoke tests protect data/scripts.
2. Vitest and React Testing Library protect pure and rendered behavior.
3. TypeScript, ESLint, and Prettier protect implementation quality.
4. Vite build plus `check:build` protects the static artifact and privacy boundary.
5. Playwright exercises uploads, persistence, navigation, filters, scoring, responsive behavior, and axe accessibility checks at the production base path.
6. GitHub Actions repeats the complete release suite before Pages deployment.
