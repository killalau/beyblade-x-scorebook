# React Migration Plan

This document is the canonical plan and progress tracker for migrating the Beyblade X Scorebook from its current vanilla JavaScript application to a modern React application.

Update this file in the same commit whenever migration work changes a phase status, completes a checklist item, changes an architectural decision, or discovers a new migration risk.

## Current Status

- Overall status: Planned
- Current phase: Phase 0 — Baseline and migration preparation
- Progress: 0 of 11 phases completed
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

| Area | Choice | Notes |
| --- | --- | --- |
| UI | React | Required foundation for the migration. |
| Language | TypeScript | Use strict types for domain models, imported JSON, and component interfaces. |
| Build tool | Vite | Produces the static `dist/` output deployed to GitHub Pages. |
| Routing | React Router | Each major page becomes a route. The GitHub Pages routing strategy is a Phase 1 decision gate. |
| Styling | Tailwind CSS | New React components use shared design tokens and utilities. |
| Component primitives | shadcn/ui, selectively | Add only components that the application uses; do not install an entire component catalogue. |
| Accessible primitives | Radix UI through shadcn/ui | Used where accessible interaction behavior is difficult to reproduce safely. |
| Complex tables | TanStack Table | Headless sorting, filtering, column, and row-model behavior with custom responsive rendering. |
| Runtime validation | Zod | Share schemas between browser imports and Node validation where practical. |
| Application state | React Context plus `useReducer` | Do not add Redux or Zustand unless measured complexity justifies it. |
| Unit tests | Vitest | Domain logic and utilities. |
| Component tests | React Testing Library | Test user-visible behavior rather than component internals. |
| End-to-end tests | Playwright | Cover file upload, navigation, filtering, storage restoration, and core calculations. |
| Code quality | ESLint and Prettier | Applied to the React/TypeScript codebase and configuration. |

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

Status: Not started

- [ ] Create a feature-parity inventory for all current pages and interactions.
- [ ] Record representative expected results for scoring, totals, filters, grouping, and sorting.
- [ ] Confirm all current tests pass before framework changes.
- [ ] Confirm private-data ignore rules and public/private data boundaries.
- [ ] Decide whether migration work occurs on one long-lived branch or small mergeable commits on `main`.

Exit criteria: the current behavior is documented well enough to detect regressions.

### Phase 1 — React, TypeScript, Vite, and Tooling Foundation

Status: Not started

- [ ] Add React, React DOM, TypeScript, and Vite.
- [ ] Add ESLint and Prettier configuration.
- [ ] Create the React entry point without deleting the existing implementation prematurely.
- [ ] Configure Vite's GitHub Pages base path.
- [ ] Select and document `HashRouter` or `BrowserRouter` plus fallback handling.
- [ ] Add `dev`, `build`, `preview`, `lint`, and type-check commands.
- [ ] Update the GitHub Pages workflow to build and publish `dist/` when the React app is ready to deploy.

Exit criteria: a minimal React application builds locally and in CI without exposing private data.

### Phase 2 — Design System Foundation

Status: Not started

- [ ] Add Tailwind CSS.
- [ ] Define color, typography, spacing, radius, elevation, and breakpoint tokens.
- [ ] Add the `cn()` class-name helper and variant conventions.
- [ ] Add only the initial shadcn/ui primitives required by the application.
- [ ] Build shared `PageHeader`, `DataStatus`, `EmptyState`, and error-state components.
- [ ] Define desktop and mobile navigation patterns.

Initial shadcn/ui candidates: Button, Input, Select, Checkbox, Tabs, Card, Badge, Dialog or Sheet, Tooltip, and Toast/Sonner.

Exit criteria: new pages can be built from a small, consistent, accessible component foundation.

### Phase 3 — Domain Logic and Type Migration

Status: Not started

- [ ] Define TypeScript domain models for collection, purchases, wishlist, catalogue, and scoring.
- [ ] Move or adapt scoring logic without changing results.
- [ ] Move inventory grouping and line-classification logic.
- [ ] Move purchase total and unit-price calculations.
- [ ] Move wishlist filters and catalogue helpers.
- [ ] Convert the existing smoke-test coverage into focused Vitest suites where appropriate.
- [ ] Keep Node data scripts functional during module conversion.

Exit criteria: pure domain functions have typed interfaces and parity tests against current behavior.

### Phase 4 — Schemas, Storage, and Private Data Loading

Status: Not started

- [ ] Define Zod schemas for collection, wishlist, and public catalogue data.
- [ ] Reuse or align schemas with `npm run validate:data` to prevent contract drift.
- [ ] Implement browser file upload with useful validation errors.
- [ ] Implement browser-local persistence and clear-data behavior.
- [ ] Handle supported data versions and future migrations explicitly.
- [ ] Test that private JSON is absent from production build artifacts.

Exit criteria: the React app can safely load, validate, persist, restore, and clear private data.

### Phase 5 — App Shell and Routing

Status: Not started

- [ ] Implement the shared application shell.
- [ ] Add routes for Scorebook, Inventory, Purchase, Wishlist, Catalogue, and Rules.
- [ ] Add active navigation states and responsive navigation.
- [ ] Display collection, wishlist, and catalogue load status.
- [ ] Add route-level error and empty states.

Exit criteria: every target page is reachable through stable navigation on desktop and mobile.

### Phase 6 — Inventory and Purchase Pages

Status: Not started

- [ ] Port the Inventory parts tabs, search, grouping, quantities, sources, notes, and line column.
- [ ] Port current-owned product cards to the Purchase page.
- [ ] Port the full Purchase History.
- [ ] Preserve tax/shipping-inclusive unit prices on history cards.
- [ ] Preserve net-spend calculations after sales and refunds.
- [ ] Preserve sold, returned, gifted, preorder, source, quantity, date, and image information.
- [ ] Add component tests for representative multi-quantity and disposed-item records.

Exit criteria: Inventory and Purchase match the current application for the same uploaded collection file.

### Phase 7 — Catalogue and Wishlist Pages

Status: Not started

- [ ] Build the reusable TanStack-based data-table foundation.
- [ ] Port Catalogue search, retailer/status filters, sorting, availability, images, and all-status behavior.
- [ ] Port Wishlist card and list views.
- [ ] Port wishlist search, sorting, part filters, part-type filters, and only-missing behavior.
- [ ] Preserve derived score, Cost Index, useful parts, availability, and ownership behavior.
- [ ] Provide responsive card rendering for small screens.

Exit criteria: Catalogue and Wishlist results match the current application and remain usable on mobile.

### Phase 8 — Scorebook and Rules Pages

Status: Not started

- [ ] Port product-row editing, CX mode, rare parts, scoring, Cost Index, and result selection.
- [ ] Port score breakdown and saved public samples.
- [ ] Port Rules content from the public scoring configuration.
- [ ] Add regression tests for representative BX, UX, CX, fused-bit, multipack, owned-part, and rare-part cases.

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

- [ ] Browser upload for collection and wishlist JSON.
- [ ] Browser-local persistence and clear-data action.
- [ ] Scorebook calculation, breakdown, CX parsing, rarity, and Cost Index.
- [ ] Inventory part tabs, search, grouping, quantities, line, sources, and notes.
- [ ] Current collection cards and complete purchase history.
- [ ] Unit paid, net spend, sold, returned, and gifted purchase behavior.
- [ ] Wishlist card/list views, sorting, search, and part filters.
- [ ] Public Catalogue auto-load, all availability statuses, filters, and sorting.
- [ ] Rules generated from public scoring configuration.
- [ ] Product images and graceful image failure states.
- [ ] Responsive layouts for phone and desktop widths.
- [ ] GitHub Pages deployment at the repository base path.

## Quality Gates for Every Migration Change

- Run the relevant Vitest and component tests once introduced.
- Run `npm run validate:data` after any local JSON or schema-related change.
- Run `npm test`.
- Run type checking and linting once those commands exist.
- Run the production build once Vite is introduced.
- Check `git status --short --untracked-files=all` before committing.
- Confirm private JSON, normalized data, and raw captures are ignored and not staged.
- Update this tracker when progress or decisions change.

## Open Decision Gates

| Decision | Target phase | Status | Options or notes |
| --- | --- | --- | --- |
| GitHub Pages routing | Phase 1 | Open | Prefer `HashRouter` for simple static reliability, or use `BrowserRouter` with a tested fallback. |
| Migration branch strategy | Phase 0 | Open | Long-lived migration branch versus small continuously mergeable commits. |
| Shared browser/Node Zod schemas | Phase 4 | Open | Prefer one source when it does not complicate Node scripts or public bundling. |
| Dialog versus Sheet for mobile details | Phase 2 | Open | Decide from the first real product-detail interaction. |

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Private data enters the Vite bundle | Never import local/private paths; add build-artifact checks and preserve Git ignore rules. |
| Rewriting UI changes scoring or totals | Port pure domain functions first and lock behavior with parity tests. |
| GitHub Pages routes or assets break | Test the production build with the repository base path before cutover. |
| A large rewrite blocks normal inventory work | Keep scripts and private JSON contracts stable; use small commits and keep the current UI deployable. |
| Tailwind and shadcn produce inconsistent styling | Define tokens and variants first; add only components with an immediate use. |
| Table abstraction becomes too generic | Extract shared behavior only after concrete Inventory, Catalogue, or Wishlist requirements demonstrate reuse. |

## Progress Log

| Date | Change | Result |
| --- | --- | --- |
| 2026-10-17 | Migration stack and phased plan agreed and documented. | Planning complete; implementation has not started. |

