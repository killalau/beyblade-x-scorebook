import type {
  PurchaseItem,
  RetailerListing,
  TradeRecord,
} from "@/domain/types";
import { purchaseUnitPaidAmount } from "@/collection-summary.js";
import { normalizeInventoryProductName } from "@/inventory-products.js";

export type PurchaseEvent = {
  kind: "sold" | "returned" | "gifted" | "traded";
  name: string;
  amount?: number;
  received?: string;
};

export type OwnedAcquisitionSummary = {
  source?: string;
  unitCost: number;
  quantity: number;
  imageUrl?: string;
  preferredPurchase?: PurchaseItem;
};

export function summarizeOwnedAcquisitions(
  purchases: PurchaseItem[],
  inventoryName: string,
  trades: TradeRecord[] = [],
): OwnedAcquisitionSummary | undefined {
  const purchaseCandidates = matchingItems(
    purchases,
    inventoryName,
    (purchase) => purchase.name,
  );
  const ownedPurchases = purchaseCandidates
    .map((purchase) => ({
      purchase,
      quantity:
        remainingPurchaseQuantity(purchase) -
        tradedQuantity(purchase.acquisitionId, trades),
      unitCost: purchaseUnitPaidAmount(purchase),
      source: purchase.source,
      imageUrl: purchase.imageUrl,
    }))
    .filter(({ quantity }) => quantity > 0);

  const receivedItems = trades.flatMap((trade) =>
    trade.received.map((item) => ({ item, trade })),
  );
  const tradeCandidates = matchingItems(
    receivedItems,
    inventoryName,
    ({ item }) => item.name,
  );
  const ownedTrades = tradeCandidates
    .map(({ item, trade }) => {
      const quantity = positiveQuantity(item.quantity);
      return {
        quantity: quantity - tradedQuantity(item.acquisitionId, trades),
        unitCost: Number(item.costBasis) / quantity,
        source: trade.source ?? "Private trade",
        imageUrl: item.imageUrl,
      };
    })
    .filter(({ quantity }) => quantity > 0);

  const owned = [...ownedPurchases, ...ownedTrades];
  if (!owned.length) return undefined;

  const quantity = owned.reduce((total, item) => total + item.quantity, 0);
  const totalCostBasis = owned.reduce(
    (total, item) => total + item.unitCost * item.quantity,
    0,
  );
  const sources = [
    ...new Set(
      owned
        .map(({ source }) => source)
        .filter((source): source is string => Boolean(source)),
    ),
  ];

  return {
    source: sources.length ? sources.join("; ") : undefined,
    unitCost: Math.round((totalCostBasis / quantity) * 100) / 100,
    quantity,
    imageUrl: owned.find(({ imageUrl }) => imageUrl)?.imageUrl,
    preferredPurchase: ownedPurchases[0]?.purchase,
  };
}

export function purchaseEvents(
  purchase: PurchaseItem,
  trades: TradeRecord[] = [],
): PurchaseEvent[] {
  return [
    ...(purchase.soldItems ?? []).map((item) => ({
      kind: "sold" as const,
      name: item.name ?? purchase.name,
      amount: finiteNumber(item.salePrice),
    })),
    ...(purchase.returnedItems ?? []).map((item) => ({
      kind: "returned" as const,
      name: item.name ?? purchase.name,
      amount: finiteNumber(item.refundAmount),
    })),
    ...(purchase.giftedItems ?? []).map((item) => ({
      kind: "gifted" as const,
      name: item.name ?? purchase.name,
    })),
    ...trades.flatMap((trade) =>
      trade.gave
        .filter(
          (item) =>
            purchase.acquisitionId &&
            item.fromAcquisitionId === purchase.acquisitionId,
        )
        .map((item) => ({
          kind: "traded" as const,
          name: item.name,
          received: trade.received
            .map((receivedItem) => receivedItem.name)
            .join("; "),
        })),
    ),
  ];
}

export function findCatalogueListingForProduct(
  listings: RetailerListing[],
  productName: string,
  purchase?: PurchaseItem,
): RetailerListing | undefined {
  const candidates = [productName, purchase?.name]
    .filter((value): value is string => Boolean(value))
    .map(normalizeInventoryProductName)
    .filter(Boolean);
  const exact = listings.filter((listing) => {
    const values = [listing.includedBeys, ...listing.configs]
      .filter((value): value is string => Boolean(value))
      .map(normalizeInventoryProductName)
      .filter(Boolean);
    return candidates.some((candidate) => values.includes(candidate));
  });
  const fuzzy = listings.filter((listing) => {
    const name = normalizeInventoryProductName(listing.name);
    return (
      name.length >= 8 &&
      candidates.some(
        (candidate) =>
          candidate.length >= 8 &&
          (name.includes(candidate) || candidate.includes(name)),
      )
    );
  });
  const matches = exact.length ? exact : fuzzy;
  const preferredRetailer = String(purchase?.source ?? "").toLowerCase();
  return (
    matches.find((listing) =>
      preferredRetailer.includes(listing.retailer.split(".")[0].toLowerCase()),
    ) ?? matches[0]
  );
}

function finiteNumber(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function remainingPurchaseQuantity(purchase: PurchaseItem): number {
  const quantity = positiveQuantity(purchase.quantity);
  const disposed = [
    purchase.soldItems,
    purchase.returnedItems,
    purchase.giftedItems,
  ].reduce(
    (total, items) => total + (Array.isArray(items) ? items.length : 0),
    0,
  );
  return Math.max(0, quantity - disposed);
}

function tradedQuantity(
  acquisitionId: string | undefined,
  trades: TradeRecord[],
): number {
  if (!acquisitionId) return 0;
  return trades.reduce(
    (total, trade) =>
      total +
      trade.gave
        .filter((item) => item.fromAcquisitionId === acquisitionId)
        .reduce(
          (tradeTotal, item) => tradeTotal + positiveQuantity(item.quantity),
          0,
        ),
    0,
  );
}

function matchingItems<T>(
  items: T[],
  inventoryName: string,
  getName: (item: T) => string,
): T[] {
  const normalizedName = normalizeInventoryProductName(inventoryName);
  const exact = items.filter(
    (item) => normalizeInventoryProductName(getName(item)) === normalizedName,
  );
  if (exact.length) return exact;
  return items.filter((item) => {
    const candidate = normalizeInventoryProductName(getName(item));
    return (
      candidate.includes(normalizedName) || normalizedName.includes(candidate)
    );
  });
}

function positiveQuantity(value: unknown): number {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}
