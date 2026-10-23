import { DollarSign, PackageCheck, ReceiptText } from "lucide-react";
import { useMemo } from "react";

import { calculateTotalSpend } from "@/collection-summary.js";
import { EmptyState } from "@/components/empty-state";
import { FileUpload } from "@/components/file-upload";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import type {
  PurchaseItem,
  RetailerListing,
  TradeRecord,
} from "@/domain/types";
import { usePublicCatalogue } from "@/features/catalogue/use-public-catalogue";
import { usePrivateData } from "@/features/private-data/use-private-data";
import {
  findCatalogueListingForProduct,
  summarizeOwnedAcquisitions,
} from "@/features/purchases/purchase-domain";
import {
  OwnedProductCard,
  PurchaseHistoryCard,
  TradeHistoryCard,
} from "@/features/purchases/purchase-cards";
import { formatCurrency } from "@/lib/format";

export function PurchasePage() {
  const { collection, loadCollection } = usePrivateData();
  const catalogue = usePublicCatalogue();
  const listings =
    catalogue.status === "ready"
      ? (catalogue.data.items as unknown as RetailerListing[])
      : [];

  const purchases = useMemo(
    () => (collection?.data.purchases.items ?? []) as unknown as PurchaseItem[],
    [collection],
  );
  const trades = useMemo(
    () => (collection?.data.trades?.items ?? []) as unknown as TradeRecord[],
    [collection],
  );

  if (!collection) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Purchase"
          description="Review current owned products and complete purchase history."
        />
        <EmptyState
          title="Load your collection"
          description="Purchase data stays in this browser."
          action={
            <FileUpload label="Load collection JSON" onFile={loadCollection} />
          }
        />
      </div>
    );
  }

  const currency = collection.data.currency ?? "CAD";
  const ownedBeys = collection.data.inventory.beys;
  const netSpend = calculateTotalSpend({ items: purchases }, { items: trades });

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Collection provenance"
        title="Purchase"
        description="Current ownership is shown separately from immutable history. Prices are tax-and-shipping-inclusive unit amounts."
      />

      <section
        className="grid gap-3 sm:grid-cols-3"
        aria-label="Purchase summary"
      >
        <SummaryCard
          icon={PackageCheck}
          label="Owned products"
          value={String(ownedBeys.length)}
        />
        <SummaryCard
          icon={ReceiptText}
          label="Purchase records"
          value={String(purchases.length)}
        />
        <SummaryCard
          icon={DollarSign}
          label="Net spend"
          value={formatCurrency(netSpend, currency)}
        />
      </section>

      <section
        className="grid gap-4"
        aria-labelledby="current-collection-title"
      >
        <div>
          <h2
            id="current-collection-title"
            className="text-2xl font-black tracking-tight"
          >
            Current Collection
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Products currently present in inventory.beys.
          </p>
        </div>
        {ownedBeys.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ownedBeys.map((bey, index) => {
              const summary = summarizeOwnedAcquisitions(
                purchases,
                bey,
                trades,
              );
              const listing = findCatalogueListingForProduct(
                listings,
                bey,
                summary?.preferredPurchase,
              );
              return (
                <OwnedProductCard
                  key={`${bey}-${index}`}
                  name={bey}
                  source={summary?.source}
                  unitCost={summary?.unitCost}
                  quantity={summary?.quantity}
                  imageUrl={summary?.imageUrl ?? listing?.imageUrl}
                  currency={currency}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No currently owned products"
            description="Purchase history remains below even when products were sold, returned, or gifted."
          />
        )}
      </section>

      <section className="grid gap-4" aria-labelledby="trade-history-title">
        <div>
          <h2
            id="trade-history-title"
            className="text-2xl font-black tracking-tight"
          >
            Trade History
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cost basis moves with traded items; only cash adjustments affect net
            spend.
          </p>
        </div>
        {trades.length ? (
          <div className="grid gap-3">
            {[...trades].reverse().map((trade) => (
              <TradeHistoryCard
                key={trade.tradeId}
                trade={trade}
                currency={currency}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No trades recorded"
            description="Trades will appear here without being counted as new purchases."
          />
        )}
      </section>

      <section className="grid gap-4" aria-labelledby="purchase-history-title">
        <div>
          <h2
            id="purchase-history-title"
            className="text-2xl font-black tracking-tight"
          >
            Purchase History
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {purchases.length} records · newest recorded row first
          </p>
        </div>
        {purchases.length ? (
          <div className="grid gap-3">
            {[...purchases].reverse().map((purchase, index) => {
              const listing = findCatalogueListingForProduct(
                listings,
                purchase.name,
                purchase,
              );
              return (
                <PurchaseHistoryCard
                  key={`${purchase.name}-${purchases.length - index}`}
                  purchase={purchase}
                  imageUrl={purchase.imageUrl ?? listing?.imageUrl}
                  currency={currency}
                  trades={trades}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No purchase records"
            description="The collection file contains no purchase-history rows."
          />
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span>
          <span className="block text-xs font-bold tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
          <strong className="text-lg">{value}</strong>
        </span>
      </CardContent>
    </Card>
  );
}
