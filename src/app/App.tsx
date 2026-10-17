import {
  Boxes,
  FlaskConical,
  Heart,
  LibraryBig,
  ListChecks,
  Scale,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Navigate, Route, Routes } from "react-router";

import {
  AppNavigation,
  type NavigationItem,
} from "@/components/app-navigation";
import { DataStatus } from "@/components/data-status";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { FileUpload } from "@/components/file-upload";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrivateData } from "@/features/private-data/use-private-data";

const navigationItems: NavigationItem[] = [
  { id: "scorebook", label: "Scorebook", href: "#", icon: FlaskConical },
  { id: "inventory", label: "Inventory", href: "#", icon: Boxes },
  { id: "purchase", label: "Purchase", href: "#", icon: ShoppingBag },
  { id: "wishlist", label: "Wishlist", href: "#", icon: Heart },
  { id: "catalogue", label: "Catalogue", href: "#", icon: LibraryBig },
  { id: "rules", label: "Rules", href: "#", icon: Scale },
];

function FoundationPage() {
  const { collection, wishlist, error, loadCollection, loadWishlist, clear } =
    usePrivateData();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <AppNavigation items={navigationItems} activeId="scorebook" />

      <PageHeader
        eyebrow="React migration · Phase 2"
        title="A sharper foundation for every battle."
        description="The Scorebook design system now has shared tokens, accessible primitives, responsive navigation, and reusable states ready for page migration."
        actions={
          <>
            <Button variant="outline" asChild>
              <a href="./">Current app</a>
            </Button>
            <Button>
              <ListChecks aria-hidden="true" />
              Foundation ready
            </Button>
            {(collection || wishlist) && (
              <Button variant="destructive" onClick={clear}>
                <Trash2 aria-hidden="true" />
                Clear private data
              </Button>
            )}
          </>
        }
      />

      <section
        className="flex flex-wrap gap-2"
        aria-label="Data status preview"
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
        <DataStatus label="Catalogue" value="Needs review" state="warning" />
      </section>

      {error && (
        <ErrorState title="Private data could not be loaded" message={error} />
      )}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Reusable interface primitives</CardTitle>
                <CardDescription>
                  Components remain locally owned and can evolve with the
                  Scorebook.
                </CardDescription>
              </div>
              <Badge variant="success">Ready</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Input
              aria-label="Example search"
              placeholder="Search parts, products, or retailers"
            />
            <Tabs defaultValue="parts">
              <TabsList aria-label="Foundation preview">
                <TabsTrigger value="parts">Parts</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="parts">
                <EmptyState
                  title={
                    collection ? "Private data is ready" : "Load private JSON"
                  }
                  description="Collection and wishlist files are validated in this browser and stored only in localStorage."
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      <FileUpload
                        label="Load collection"
                        onFile={loadCollection}
                      />
                      <FileUpload label="Load wishlist" onFile={loadWishlist} />
                    </div>
                  }
                />
              </TabsContent>
              <TabsContent value="products">
                <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                  Product cards will reuse the same spacing, color, and state
                  tokens.
                </p>
              </TabsContent>
              <TabsContent value="history">
                <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                  Purchase History will preserve unit-price and disposal
                  semantics.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Status language</CardTitle>
              <CardDescription>
                Consistent badges distinguish product and data states.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>Primary</Badge>
              <Badge variant="secondary">Owned</Badge>
              <Badge variant="success">Available</Badge>
              <Badge variant="warning">Delayed</Badge>
              <Badge variant="destructive">Returned</Badge>
            </CardContent>
          </Card>

          <ErrorState
            title="Validation preview"
            message="Future upload errors will use a consistent accessible alert pattern."
          />
        </div>
      </section>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route index element={<FoundationPage />} />
      <Route path="foundation" element={<FoundationPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
