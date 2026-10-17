import type { PurchaseItem } from "./domain/types";

export function normalizeInventoryProductName(value: unknown): string;
export function findPurchaseForInventoryBey(
  purchases: PurchaseItem[],
  bey: string,
): PurchaseItem | undefined;
