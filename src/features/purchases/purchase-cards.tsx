import { ArrowRight, Repeat2 } from "lucide-react";

import type { PurchaseItem, TradeRecord } from "@/domain/types";
import { purchaseUnitPaidAmount } from "@/collection-summary.js";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { purchaseEvents } from "@/features/purchases/purchase-domain";
import { formatCurrency } from "@/lib/format";

export function OwnedProductCard({
  name,
  source,
  unitCost,
  quantity,
  imageUrl,
  currency,
}: {
  name: string;
  source?: string;
  unitCost?: number;
  quantity?: number;
  imageUrl?: string;
  currency: string;
}) {
  return (
    <Card className="h-full">
      <CardContent className="grid h-full grid-cols-[auto_minmax(0,1fr)] gap-3 p-4">
        <ProductThumbnail imageUrl={imageUrl} name={name} className="size-16" />
        <div className="min-w-0 self-center">
          <h2 className="font-extrabold text-pretty">{name}</h2>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {source ?? "Owned item"}
          </p>
        </div>
        <span className="col-span-2 flex items-end justify-between gap-3 border-t border-border pt-3">
          <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            {quantity && quantity > 1 ? "Avg cost" : "Cost"}
          </span>
          <strong className="shrink-0 text-sm">
            {unitCost !== undefined ? formatCurrency(unitCost, currency) : "-"}
          </strong>
        </span>
      </CardContent>
    </Card>
  );
}

export function PurchaseHistoryCard({
  purchase,
  imageUrl,
  currency,
  trades = [],
}: {
  purchase: PurchaseItem;
  imageUrl?: string;
  currency: string;
  trades?: TradeRecord[];
}) {
  const events = purchaseEvents(purchase, trades);
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
                      : event.kind === "sold" || event.kind === "traded"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {event.kind === "sold"
                    ? "Sold"
                    : event.kind === "returned"
                      ? "Returned"
                      : event.kind === "gifted"
                        ? "Gifted"
                        : "Traded"}
                  : {event.name}
                  {event.received ? ` → ${event.received}` : ""}
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

export function TradeHistoryCard({
  trade,
  currency,
}: {
  trade: TradeRecord;
  currency: string;
}) {
  const receivedImage = trade.received.find((item) => item.imageUrl);
  const cashPaid = Number(trade.cashPaid ?? 0);
  const cashReceived = Number(trade.cashReceived ?? 0);

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <ProductThumbnail
          imageUrl={receivedImage?.imageUrl}
          name={receivedImage?.name ?? "Trade"}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Repeat2 aria-hidden="true" className="size-4 text-primary" />
            <h3 className="font-extrabold">
              {trade.source ?? "Private trade"}
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{trade.tradedAt}</p>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-[1fr_auto_1fr] md:items-center">
            <TradeItems
              label="Gave"
              items={trade.gave.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                costBasis: item.transferredCostBasis,
              }))}
              currency={currency}
            />
            <ArrowRight
              aria-hidden="true"
              className="hidden size-4 text-muted-foreground md:block"
            />
            <TradeItems
              label="Received"
              items={trade.received}
              currency={currency}
            />
          </div>
        </div>
        <div className="sm:text-right">
          <span className="block text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Cash adjustment
          </span>
          <strong>
            {cashPaid > 0
              ? `Paid ${formatCurrency(cashPaid, currency)}`
              : cashReceived > 0
                ? `Received ${formatCurrency(cashReceived, currency)}`
                : "Even trade"}
          </strong>
        </div>
      </CardContent>
    </Card>
  );
}

function TradeItems({
  label,
  items,
  currency,
}: {
  label: string;
  items: Array<{
    name: string;
    quantity?: number | string;
    costBasis: number | string;
  }>;
  currency: string;
}) {
  return (
    <div>
      <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {items.map((item, index) => {
        const quantity = Number(item.quantity ?? 1);
        return (
          <p key={`${item.name}-${index}`} className="font-semibold">
            {item.name}
            {quantity > 1 ? ` ×${quantity}` : ""} · cost basis{" "}
            {formatCurrency(Number(item.costBasis), currency)}
          </p>
        );
      })}
    </div>
  );
}
