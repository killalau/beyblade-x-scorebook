import type { WishlistItem } from "@/domain/types";

export type WishlistSort =
  "costIndex" | "score" | "price" | "createdAt" | "name";

export function compareWishlistItems(
  a: WishlistItem,
  b: WishlistItem,
  sort: WishlistSort,
): number {
  if (sort === "name") return a.name.localeCompare(b.name);
  if (sort === "createdAt")
    return sortableDate(b.createdAt) - sortableDate(a.createdAt);
  const aValue = Number(a[sort]);
  const bValue = Number(b[sort]);
  if (sort === "score")
    return finiteOr(bValue, -Infinity) - finiteOr(aValue, -Infinity);
  return sortablePositive(aValue) - sortablePositive(bValue);
}

export function matchesWishlistSearch(
  item: WishlistItem,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  return !normalized || JSON.stringify(item).toLowerCase().includes(normalized);
}

function sortableDate(value: unknown): number {
  const timestamp = Date.parse(String(value ?? ""));
  return Number.isFinite(timestamp) ? timestamp : -Infinity;
}

function sortablePositive(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : Infinity;
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}
