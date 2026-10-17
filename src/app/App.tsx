import { Navigate, Route, Routes } from "react-router";

import { AppShell } from "@/app/AppShell";
import { RouteErrorBoundary } from "@/app/RouteErrorBoundary";
import { CataloguePage } from "@/pages/CataloguePage";
import { InventoryPage } from "@/pages/InventoryPage";
import { PurchasePage } from "@/pages/PurchasePage";
import { RulesPage } from "@/pages/RulesPage";
import { ScorebookPage } from "@/pages/ScorebookPage";
import { WishlistPage } from "@/pages/WishlistPage";

export function App() {
  return (
    <RouteErrorBoundary>
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
    </RouteErrorBoundary>
  );
}
