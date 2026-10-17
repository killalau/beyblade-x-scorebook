import type { PurchaseItem } from "@/domain/types";
import { purchaseUnitPaidAmount } from "@/collection-summary.js";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { purchaseEvents } from "@/features/purchases/purchase-domain";
import { formatCurrency } from "@/lib/format";

export function OwnedProductCard({
  name,
  purchase,
  imageUrl,
  currency,
}: {
  name: string;
  purchase?: PurchaseItem;
  imageUrl?: string;
  currency: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <ProductThumbnail imageUrl={imageUrl} name={name} />
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold text-pretty">{name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {purchase?.source ?? "Owned item"}
          </p>
        </div>
        <strong className="shrink-0 text-sm">
          {purchase
            ? formatCurrency(purchaseUnitPaidAmount(purchase), currency)
            : "-"}
        </strong>
      </CardContent>
    </Card>
  );
}

export function PurchaseHistoryCard({
  purchase,
  imageUrl,
  currency,
}: {
  purchase: PurchaseItem;
  imageUrl?: string;
  currency: string;
}) {
  const events = purchaseEvents(purchase);
  const quantity = Number(purchase.quantity);
  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <ProductThumbnail imageUrl={imageUrl} name={purchase.name} />
        <div className="min-w-0">
          <h3 className="font-extrabold text-pretty">{purchase.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {purchase.source ?? "Unknown source"}
            {Number.isFinite(quantity) && quantity > 1
              ? ` · Qty ${quantity}`
              : ""}
          </p>
          {purchase.recordedFrom && (
            <p className="mt-1 text-xs text-muted-foreground">
              {purchase.recordedFrom}
            </p>
          )}
          {purchase.status && purchase.status !== "purchased" && (
            <Badge className="mt-2" variant="warning">
              {purchase.status}
            </Badge>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {events.length ? (
              events.map((event, index) => (
                <Badge
                  key={`${event.kind}-${index}`}
                  variant={
                    event.kind === "returned"
                      ? "destructive"
                      : event.kind === "sold"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {event.kind === "sold"
                    ? "Sold"
                    : event.kind === "returned"
                      ? "Returned"
                      : "Gifted"}
                  : {event.name}
                  {event.amount !== undefined
                    ? ` · ${formatCurrency(event.amount, currency)}`
                    : ""}
                </Badge>
              ))
            ) : (
              <Badge variant="success">Kept</Badge>
            )}
          </div>
        </div>
        <div className="sm:text-right">
          <span className="block text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Unit paid
          </span>
          <strong>
            {formatCurrency(purchaseUnitPaidAmount(purchase), currency)}
          </strong>
        </div>
      </CardContent>
    </Card>
  );
}
