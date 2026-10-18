import type { RetailerListing } from "@/domain/types";

export const availabilityOrder = [
  "available_now",
  "preorder",
  "delayed",
  "backorder",
  "out_of_stock",
  "unavailable",
  "not_observed",
  "unknown",
] as const;
export type CatalogueSort =
  "recent" | "name" | "priceAsc" | "priceDesc" | "retailer" | "availability";

export function compareCatalogueItems(
  a: RetailerListing,
  b: RetailerListing,
  sort: CatalogueSort,
): number {
  const byName = a.name.localeCompare(b.name);
  if (sort === "name") return byName;
  if (sort === "retailer")
    return a.retailer.localeCompare(b.retailer) || byName;
  if (sort === "availability")
    return (
      statusIndex(a.availabilityStatus) - statusIndex(b.availabilityStatus) ||
      byName
    );
  if (sort === "priceAsc")
    return sortablePositive(a.price) - sortablePositive(b.price) || byName;
  if (sort === "priceDesc")
    return compareFiniteDescending(a.price, b.price) || byName;
  return (
    compareFiniteDescending(dateValue(a.lastSeenAt), dateValue(b.lastSeenAt)) ||
    byName
  );
}

export function matchesCatalogueSearch(
  item: RetailerListing,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [item.name, item.retailer, item.includedBeys, ...item.configs]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

function statusIndex(status: string): number {
  const index = availabilityOrder.indexOf(
    status as (typeof availabilityOrder)[number],
  );
  return index < 0 ? availabilityOrder.length : index;
}

function sortablePositive(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : Infinity;
}

function dateValue(value: unknown): number {
  const timestamp = Date.parse(String(value ?? ""));
  return Number.isFinite(timestamp) ? timestamp : NaN;
}

function compareFiniteDescending(aValue: unknown, bValue: unknown): number {
  const a = Number(aValue);
  const b = Number(bValue);
  if (!Number.isFinite(a)) return Number.isFinite(b) ? 1 : 0;
  if (!Number.isFinite(b)) return -1;
  return b - a;
}
