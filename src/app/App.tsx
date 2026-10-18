import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";

import { AppShell } from "@/app/AppShell";
import { RouteErrorBoundary } from "@/app/RouteErrorBoundary";
import { EmptyState } from "@/components/empty-state";

const CataloguePage = lazy(() =>
  import("@/pages/CataloguePage").then((module) => ({
    default: module.CataloguePage,
  })),
);
const InventoryPage = lazy(() =>
  import("@/pages/InventoryPage").then((module) => ({
    default: module.InventoryPage,
  })),
);
const PurchasePage = lazy(() =>
  import("@/pages/PurchasePage").then((module) => ({
    default: module.PurchasePage,
  })),
);
const RulesPage = lazy(() =>
  import("@/pages/RulesPage").then((module) => ({ default: module.RulesPage })),
);
const ScorebookPage = lazy(() =>
  import("@/pages/ScorebookPage").then((module) => ({
    default: module.ScorebookPage,
  })),
);
const WishlistPage = lazy(() =>
  import("@/pages/WishlistPage").then((module) => ({
    default: module.WishlistPage,
  })),
);

export function App() {
  return (
    <RouteErrorBoundary>
      <Suspense
        fallback={
          <EmptyState
            title="Loading page"
            description="Preparing this Scorebook view…"
          />
        }
      >
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<ScorebookPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="purchase" element={<PurchasePage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="catalogue" element={<CataloguePage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
