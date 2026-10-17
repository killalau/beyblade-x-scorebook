import type { PurchaseItem, RetailerListing } from "@/domain/types";
import { normalizeInventoryProductName } from "@/inventory-products.js";

export type PurchaseEvent = {
  kind: "sold" | "returned" | "gifted";
  name: string;
  amount?: number;
};

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
