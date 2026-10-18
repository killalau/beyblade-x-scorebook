# React Migration Plan

This document is the canonical plan and progress tracker for migrating the Beyblade X Scorebook from its current vanilla JavaScript application to a modern React application.

Update this file in the same commit whenever migration work changes a phase status, completes a checklist item, changes an architectural decision, or discovers a new migration risk.

## Current Status

- Overall status: In progress
- Current phase: Phase 9 — End-to-end testing and accessibility
- Progress: 9 of 11 phases completed
- Last updated: 2026-10-17
- Production application: Existing vanilla JavaScript version
- Target hosting: GitHub Pages

## Goals

- Migrate the user interface to React and TypeScript.
- Improve component reuse, maintainability, responsive behavior, accessibility, and automated testing.
- Preserve every existing user-facing feature before removing the vanilla application.
- Keep GitHub Pages as static hosting.
- Keep JSON as the source of truth.
- Preserve the browser-only privacy model for collection and wishlist data.
- Keep retailer crawling, normalization, catalogue export, scoring, and wishlist generation deterministic and scriptable.
- Establish a small, consistent design system that can support later visual improvements.

## Non-Goals

- Adding a server, database, authentication system, or cloud synchronization during the migration.
- Moving private JSON into the public build or repository.
- Rewriting the retailer crawl and data-generation scripts as React code.
- Changing scoring rules, wishlist eligibility, inventory semantics, or data contracts merely to accommodate the UI framework.
- Performing a large visual redesign before feature parity is established.

## Agreed Target Stack

| Area                  | Choice                           | Notes                                                                                          |
| --------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| UI                    | React                            | Required foundation for the migration.                                                         |
| Language              | TypeScript                       | Use strict types for domain models, imported JSON, and component interfaces.                   |
| Build tool            | Vite                             | Produces the static `dist/` output deployed to GitHub Pages.                                   |
| Routing               | React Router                     | Each major page becomes a route. The GitHub Pages routing strategy is a Phase 1 decision gate. |
| Styling               | Tailwind CSS                     | New React components use shared design tokens and utilities.                                   |
| Component primitives  | shadcn/ui, selectively           | Add only components that the application uses; do not install an entire component catalogue.   |
| Accessible primitives | Radix UI through shadcn/ui       | Used where accessible interaction behavior is difficult to reproduce safely.                   |
| Complex tables        | TanStack Table                   | Headless sorting, filtering, column, and row-model behavior with custom responsive rendering.  |
| Runtime validation    | Zod                              | Share schemas between browser imports and Node validation where practical.                     |
| Application state     | React Context plus `useReducer`  | Do not add Redux or Zustand unless measured complexity justifies it.                           |
| Unit tests            | Vitest                           | Domain logic and utilities.                                                                    |
| Mutation tests        | StrykerJS with the Vitest runner | Measure whether high-value domain tests detect meaningful logic changes.                       |
| Component tests       | React Testing Library            | Test user-visible behavior rather than component internals.                                    |
| End-to-end tests      | Playwright                       | Cover file upload, navigation, filtering, storage restoration, and core calculations.          |
| Code quality          | ESLint and Prettier              | Applied to the React/TypeScript codebase and configuration.                                    |

## Architectural Constraints

1. JSON remains authoritative. Excel remains legacy/export-only.
2. `data/collection.local.json`, `data/wishlist.local.json`, `data/normalized/`, and `data/raw/` remain private and ignored by Git.
3. The public React bundle must not import, copy, glob, or otherwise embed private local files.
4. Private collection and wishlist data continue to enter the app only through browser upload and remain in browser-local storage.
5. `data/retailer-listings.json` remains the sanitized public Catalogue snapshot.
6. Existing Node commands for validation, crawling, normalization, catalogue export, and wishlist generation remain operational throughout the migration.
7. Existing domain behavior must be characterized by tests before its implementation is materially changed.
8. The current production application remains deployable until the React replacement reaches feature parity.

## Target Application Structure

```text
src/
  app/
    App.tsx
    AppShell.tsx
    router.tsx
  pages/
    ScorebookPage.tsx
    InventoryPage.tsx
    PurchasePage.tsx
    WishlistPage.tsx
    CataloguePage.tsx
    RulesPage.tsx
  components/
    data-table/
    data-status/
    empty-state/
    file-upload/
    filters/
    product-card/
  features/
    catalogue/
    collection/
    inventory/
    purchases/
    scoring/
    wishlist/
  domain/
  schemas/
  storage/
  styles/
```

This is a direction rather than a rigid requirement. Prefer feature ownership and clear boundaries over matching the tree exactly.

## Migration Phases

### Phase 0 — Baseline and Migration Preparation

Status: Complete

- [x] Create a feature-parity inventory for all current pages and interactions in `docs/react-feature-parity-baseline.md`.
- [x] Record representative expected results for scoring, totals, filters, grouping, and sorting.
- [x] Confirm all current tests pass before framework changes.
- [x] Confirm private-data ignore rules and public/private data boundaries.
- [x] Use the long-lived `codex/react-migration` branch while keeping `main` deployable.

Exit criteria: the current behavior is documented well enough to detect regressions.

### Phase 1 — React, TypeScript, Vite, and Tooling Foundation

Status: Complete

- [x] Add React, React DOM, TypeScript, and Vite.
- [x] Add ESLint and Prettier configuration.
- [x] Create the `/react.html` React entry point while retaining the existing application at `/`.
- [x] Configure Vite's `/beyblade-x-scorebook/` GitHub Pages base path for production builds.
- [x] Configure `HashRouter` with a fallback route.
- [x] Add `dev`, `dev:legacy`, `build`, `preview`, `lint`, `format:check`, `typecheck`, and `check:build` commands.
- [x] Add non-deploying migration-branch CI; intentionally defer the production Pages workflow switch to the approved Phase 10 cutover.

Exit criteria: a minimal React application builds locally and in CI without exposing private data.

### Phase 2 — Design System Foundation

Status: Complete

- [x] Add Tailwind CSS through its Vite plugin and CSS-first configuration.
- [x] Define color, typography, spacing, radius, elevation, and responsive tokens.
- [x] Add the `cn()` class-name helper and class-variance conventions.
- [x] Add the initial locally owned shadcn-compatible Button, Input, Card, Badge, and accessible Radix Tabs primitives.
- [x] Build shared `PageHeader`, `DataStatus`, `EmptyState`, and `ErrorState` components.
- [x] Define and browser-test desktop and horizontally scrollable mobile navigation patterns.

Initial shadcn/ui candidates: Button, Input, Select, Checkbox, Tabs, Card, Badge, Dialog or Sheet, Tooltip, and Toast/Sonner.

Exit criteria: new pages can be built from a small, consistent, accessible component foundation.

### Phase 3 — Domain Logic and Type Migration

Status: Complete

- [x] Define TypeScript domain models for collection, purchases, wishlist, catalogue, and scoring.
- [x] Move or adapt scoring logic without changing results.
- [x] Move inventory grouping and line-classification logic.
- [x] Move purchase total and unit-price calculations.
- [x] Move wishlist filters and catalogue helpers.
- [x] Convert the existing smoke-test coverage into focused Vitest suites where appropriate.
- [x] Add StrykerJS core and its Vitest runner.
- [x] Add a targeted Stryker configuration and `test:mutation` command.
- [x] Initially mutate only high-value pure domain modules: scoring, purchase calculations, inventory grouping, wishlist eligibility, and filters.
- [x] Exclude React rendering, generated data, scripts with external side effects, and broad configuration files from the initial mutation scope.
- [x] Record an initial mutation-score baseline before choosing an enforcement threshold.
- [x] Keep Node data scripts functional during module conversion.

Exit criteria: pure domain functions have typed interfaces and parity tests against current behavior, and the targeted mutation suite produces a reviewed baseline report.

### Phase 4 — Schemas, Storage, and Private Data Loading

Status: Complete

- [x] Define Zod schemas for collection, wishlist, and public catalogue data.
- [x] Reuse or align schemas with `npm run validate:data` to prevent contract drift.
- [x] Implement browser file upload with useful validation errors.
- [x] Implement browser-local persistence and clear-data behavior.
- [x] Handle supported data versions and future migrations explicitly.
- [x] Test that private JSON is absent from production build artifacts.

Exit criteria: the React app can safely load, validate, persist, restore, and clear private data.

### Phase 5 — App Shell and Routing

Status: Complete

- [x] Implement the shared application shell.
- [x] Add routes for Scorebook, Inventory, Purchase, Wishlist, Catalogue, and Rules.
- [x] Add active navigation states and responsive navigation.
- [x] Display collection, wishlist, and catalogue load status.
- [x] Add route-level error and empty states.

Exit criteria: every target page is reachable through stable navigation on desktop and mobile.

### Phase 6 — Inventory and Purchase Pages

Status: Complete

- [x] Port the Inventory parts tabs, search, grouping, quantities, sources, notes, and line column.
- [x] Port current-owned product cards to the Purchase page.
- [x] Port the full Purchase History.
- [x] Preserve tax/shipping-inclusive unit prices on history cards.
- [x] Preserve net-spend calculations after sales and refunds.
- [x] Preserve sold, returned, gifted, preorder, source, quantity, date, and image information.
- [x] Add component tests for representative multi-quantity and disposed-item records.

Exit criteria: Inventory and Purchase match the current application for the same uploaded collection file.

### Phase 7 — Catalogue and Wishlist Pages

Status: Complete

- [x] Build the reusable TanStack-based data-table foundation.
- [x] Port Catalogue search, retailer/status filters, sorting, availability, images, and all-status behavior.
- [x] Port Wishlist card and list views.
- [x] Port wishlist search, sorting, part filters, part-type filters, and only-missing behavior.
- [x] Preserve derived score, Cost Index, useful parts, availability, and ownership behavior.
- [x] Provide responsive card rendering for small screens.

Exit criteria: Catalogue and Wishlist results match the current application and remain usable on mobile.

### Phase 8 — Scorebook and Rules Pages

Status: Complete

- [x] Port product-row editing, CX mode, rare parts, scoring, Cost Index, and result selection.
- [x] Port score breakdown and saved public samples.
- [x] Port Rules content from the public scoring configuration.
- [x] Add regression tests for representative BX, UX, CX, fused-bit, multipack, owned-part, and rare-part cases.

Exit criteria: scoring output is identical to the current implementation for the parity fixtures.

### Phase 9 — End-to-End Testing and Accessibility

Status: Not started

- [ ] Add Playwright configuration and test fixtures containing synthetic, non-private data.
- [ ] Test upload, reload restoration, clear data, routing, filters, sorting, and responsive navigation.
- [ ] Test the production build under the repository base path.
- [ ] Verify keyboard navigation, focus visibility, labels, landmarks, and tab semantics.
- [ ] Run an automated accessibility check and manually inspect critical flows.

Exit criteria: critical user journeys pass in a production-like browser build.

### Phase 10 — Production Cutover and Cleanup

Status: Not started

- [ ] Confirm feature parity and obtain user approval for cutover.
- [ ] Deploy the React `dist/` build through GitHub Actions.
- [ ] Verify the live GitHub Pages site, assets, routing, uploads, and local persistence.
- [ ] Remove superseded vanilla rendering and event code.
- [ ] Update README, AGENTS.md, hosting notes, commands, and architecture documentation.
- [ ] Confirm crawler, normalization, catalogue export, wishlist generation, validation, and tests still pass.
- [ ] Confirm private JSON and raw files remain ignored and unstaged.

Exit criteria: the React application is production, the old UI is removed, and all project workflows remain documented and operational.

## Feature-Parity Checklist

This checklist spans multiple phases and must be complete before production cutover.

- [x] Browser upload for collection and wishlist JSON.
- [x] Browser-local persistence and clear-data action.
- [x] Scorebook calculation, breakdown, CX parsing, rarity, and Cost Index.
- [x] Inventory part tabs, search, grouping, quantities, line, sources, and notes.
- [x] Current collection cards and complete purchase history.
- [x] Unit paid, net spend, sold, returned, and gifted purchase behavior.
- [x] Wishlist card/list views, sorting, search, and part filters.
- [x] Public Catalogue auto-load, all availability statuses, filters, and sorting.
- [x] Rules generated from public scoring configuration.
- [x] Product images and graceful image failure states.
- [ ] Responsive layouts for phone and desktop widths.
- [ ] GitHub Pages deployment at the repository base path.

## Quality Gates for Every Migration Change

- Run the relevant Vitest and component tests once introduced.
- Run the targeted Stryker suite when changing mutation-scoped domain logic or its tests. It is not required for documentation-only or styling-only changes.
- Run `npm run validate:data` after any local JSON or schema-related change.
- Run `npm test`.
- Run type checking and linting once those commands exist.
- Run the production build once Vite is introduced.
- Check `git status --short --untracked-files=all` before committing.
- Confirm private JSON, normalized data, and raw captures are ignored and not staged.
- Update this tracker when progress or decisions change.

## Human Review Policy

- Phases 1 through 9 may proceed autonomously without intermediate visual approval.
- Migration work must remain on `codex/react-migration`, with reviewed commits pushed regularly while `main` and the live site remain unchanged.
- The user will perform the visual and feature review at the final stage.
- Phase 10 production cutover is a mandatory human gate. Do not merge to `main`, replace the live GitHub Pages application, remove the vanilla UI, or activate the new deployment workflow without explicit user approval.
- A new human decision may still be requested earlier if work encounters a material product-scope choice, privacy risk, destructive change, or requirement that cannot be resolved from the agreed defaults.

## Open Decision Gates

| Decision                                | Target phase | Status  | Options or notes                                                                                                                                                                                                        |
| --------------------------------------- | ------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Pages routing                    | Phase 1      | Decided | Use `HashRouter` for reliable static routing on GitHub Pages.                                                                                                                                                           |
| Migration branch strategy               | Phase 0      | Decided | Use the long-lived `codex/react-migration` branch; keep `main` and the live site stable until cutover.                                                                                                                  |
| Shared browser/Node Zod schemas         | Phase 4      | Decided | Browser Zod schemas intentionally mirror the Node validator and preserve extension fields. Keep the dependency-free Node CLI validator stable during migration; parity fixtures cover shared rules.                     |
| Dialog versus Sheet for mobile details  | Phase 2      | Decided | Neither is needed for current parity: product details remain inline or in responsive cards/tables, avoiding an unnecessary modal dependency.                                                                            |
| Mutation score threshold and CI cadence | Phase 3      | Decided | Baseline: 55.61% overall (59.89% covered); Phase 8 result: 58.84% overall (63.37% covered). Enforce a 50% break threshold locally and keep the targeted suite opt-in rather than running it on every migration CI push. |

## Risks and Mitigations

| Risk                                             | Mitigation                                                                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Private data enters the Vite bundle              | Never import local/private paths; add build-artifact checks and preserve Git ignore rules.                                              |
| Rewriting UI changes scoring or totals           | Port pure domain functions first and lock behavior with parity tests.                                                                   |
| GitHub Pages routes or assets break              | Test the production build with the repository base path before cutover.                                                                 |
| A large rewrite blocks normal inventory work     | Keep scripts and private JSON contracts stable; use small commits and keep the current UI deployable.                                   |
| Tailwind and shadcn produce inconsistent styling | Define tokens and variants first; add only components with an immediate use.                                                            |
| Table abstraction becomes too generic            | Extract shared behavior only after concrete Inventory, Catalogue, or Wishlist requirements demonstrate reuse.                           |
| Mutation testing becomes too slow or noisy       | Restrict mutation scope to pure business logic, use the Vitest runner's related-test support, and expand scope only when it adds value. |

## Progress Log

| Date       | Change                                                 | Result                                                                                                                                                                                                                                                                                                        |
| ---------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-17 | Migration stack and phased plan agreed and documented. | Planning complete; implementation has not started.                                                                                                                                                                                                                                                            |
| 2026-10-17 | Added StrykerJS mutation testing to the target stack.  | Planned for high-value domain logic with a baseline-first threshold and selective execution.                                                                                                                                                                                                                  |
| 2026-10-17 | Completed Phase 0 on `codex/react-migration`.          | Recorded feature parity and representative outputs, verified tests/privacy boundaries, and selected HashRouter plus a long-lived migration branch.                                                                                                                                                            |
| 2026-10-17 | Confirmed the human review policy.                     | Phases 1–9 proceed autonomously; user review and explicit approval are required before Phase 10 production cutover.                                                                                                                                                                                           |
| 2026-10-17 | Completed Phase 1.                                     | Added the React/TypeScript/Vite/HashRouter foundation, quality tooling, dual-entry production build, build privacy check, and non-deploying migration CI.                                                                                                                                                     |
| 2026-10-17 | Completed Phase 2.                                     | Added Tailwind CSS-first design tokens, minimal shadcn-compatible primitives, shared page/data states, and responsive navigation foundations.                                                                                                                                                                 |
| 2026-10-17 | Completed Phase 3.                                     | Added strict domain contracts and JS-module declarations, 13 focused Vitest parity tests, and a targeted Stryker suite with a 55.61% baseline and 50% enforcement floor while preserving Node scripts.                                                                                                        |
| 2026-10-17 | Completed Phase 4.                                     | Added aligned Zod runtime contracts, useful upload errors, versioned browser-only persistence compatible with legacy envelopes, clear-data behavior, and schema/storage privacy tests.                                                                                                                        |
| 2026-10-17 | Completed Phase 5.                                     | Added the shared shell, six stable hash routes, active and mobile-scrollable navigation, global data controls/status, public Catalogue auto-loading, and route-level empty/error states. Browser smoke verified 125 public listings and no console errors.                                                    |
| 2026-10-17 | Completed Phase 6.                                     | Ported grouped Inventory tabs/search/table and the Purchase summary, current collection, complete reverse-order history, image fallback, unit-paid, net-spend, disposal, preorder, source, quantity, and provenance behavior. Added React component tests for multi-quantity and disposed records.            |
| 2026-10-17 | Completed Phase 7.                                     | Added a reusable TanStack v8 table, all-status Catalogue search/filter/sorting with responsive cards, and Wishlist card/list views with persistent view/part filters, any/all and only-missing behavior, derived metrics, dates, and image fallback.                                                          |
| 2026-10-17 | Completed Phase 8.                                     | Ported live multi-row Scorebook editing, per-row CX mode, rare and owned parts, result selection, full score breakdown, saved public samples, and Rules rendered from shared scoring configuration. Regression coverage now explicitly spans BX, UX, CX, fused Bits, multipacks, owned parts, and rare parts. |
