import {
  Boxes,
  FlaskConical,
  Heart,
  LibraryBig,
  Scale,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Outlet } from "react-router";

import {
  AppNavigation,
  type NavigationItem,
} from "@/components/app-navigation";
import { DataStatus } from "@/components/data-status";
import { ErrorState } from "@/components/error-state";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { usePublicCatalogue } from "@/features/catalogue/use-public-catalogue";
import { usePrivateData } from "@/features/private-data/use-private-data";

const navigationItems: NavigationItem[] = [
  { id: "scorebook", label: "Scorebook", to: "/", icon: FlaskConical },
  { id: "inventory", label: "Inventory", to: "/inventory", icon: Boxes },
  { id: "purchase", label: "Purchase", to: "/purchase", icon: ShoppingBag },
  { id: "wishlist", label: "Wishlist", to: "/wishlist", icon: Heart },
  { id: "catalogue", label: "Catalogue", to: "/catalogue", icon: LibraryBig },
  { id: "rules", label: "Rules", to: "/rules", icon: Scale },
];

export function AppShell() {
  const { collection, wishlist, error, loadCollection, loadWishlist, clear } =
    usePrivateData();
  const catalogue = usePublicCatalogue();
  const catalogueStatus =
    catalogue.status === "ready"
      ? `${catalogue.data.items.length} listings`
      : catalogue.status === "error"
        ? "Unavailable"
        : "Loading";

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-7xl content-start gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <AppNavigation items={navigationItems} />
      <section
        className="flex flex-wrap items-center gap-2"
        aria-label="Application data status"
      >
        <DataStatus
          label="Collection"
          value={collection?.fileName ?? "Not loaded"}
          state={collection ? "ready" : "idle"}
        />
        <DataStatus
          label="Wishlist"
          value={wishlist?.fileName ?? "Not loaded"}
          state={wishlist ? "ready" : "idle"}
        />
        <DataStatus
          label="Catalogue"
          value={catalogueStatus}
          state={
            catalogue.status === "ready"
              ? "ready"
              : catalogue.status === "error"
                ? "error"
                : "idle"
          }
        />
        <div className="ml-auto flex flex-wrap gap-2">
          <FileUpload label="Collection JSON" onFile={loadCollection} />
          <FileUpload label="Wishlist JSON" onFile={loadWishlist} />
          {(collection || wishlist) && (
            <Button type="button" variant="destructive" onClick={clear}>
              <Trash2 aria-hidden="true" />
              Clear data
            </Button>
          )}
        </div>
      </section>
      {error && (
        <ErrorState title="Private data could not be loaded" message={error} />
      )}
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
