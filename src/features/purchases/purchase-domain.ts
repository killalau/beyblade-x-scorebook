import type { PurchaseItem, RetailerListing } from "@/domain/types";
import { purchaseUnitPaidAmount } from "@/collection-summary.js";
import { normalizeInventoryProductName } from "@/inventory-products.js";

export type PurchaseEvent = {
  kind: "sold" | "returned" | "gifted";
  name: string;
  amount?: number;
};

export type OwnedPurchaseSummary = {
  source?: string;
  unitPaid: number;
  imageUrl?: string;
  preferredPurchase: PurchaseItem;
};

export function summarizeOwnedPurchases(
  purchases: PurchaseItem[],
  inventoryName: string,
): OwnedPurchaseSummary | undefined {
  const normalizedName = normalizeInventoryProductName(inventoryName);
  const exact = purchases.filter(
    (purchase) =>
      normalizeInventoryProductName(purchase.name) === normalizedName,
  );
  const candidates = exact.length
    ? exact
    : purchases.filter((purchase) => {
        const normalizedPurchase = normalizeInventoryProductName(purchase.name);
        return (
          normalizedPurchase.includes(normalizedName) ||
          normalizedName.includes(normalizedPurchase)
        );
      });
  const owned = candidates
    .map((purchase) => ({
      purchase,
      quantity: remainingQuantity(purchase),
    }))
    .filter(({ quantity }) => quantity > 0);
  if (!owned.length) return undefined;

  const quantity = owned.reduce((total, item) => total + item.quantity, 0);
  const totalPaid = owned.reduce(
    (total, item) =>
      total + purchaseUnitPaidAmount(item.purchase) * item.quantity,
    0,
  );
  const sources = [
    ...new Set(
      owned
        .map(({ purchase }) => purchase.source)
        .filter((source): source is string => Boolean(source)),
    ),
  ];

  return {
    source: sources.length ? sources.join("; ") : undefined,
    unitPaid: Math.round((totalPaid / quantity) * 100) / 100,
    imageUrl: owned.find(({ purchase }) => purchase.imageUrl)?.purchase
      .imageUrl,
    preferredPurchase: owned[0].purchase,
  };
}

export function purchaseEvents(purchase: PurchaseItem): PurchaseEvent[] {
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

function remainingQuantity(purchase: PurchaseItem): number {
  const recordedQuantity = Number(purchase.quantity);
  const quantity =
    Number.isFinite(recordedQuantity) && recordedQuantity > 0
      ? recordedQuantity
      : 1;
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
