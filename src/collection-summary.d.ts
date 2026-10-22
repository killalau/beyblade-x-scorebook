import type { PurchaseItem, Purchases, Trades } from "./domain/types";

export function calculateTotalSpend(
  purchases?: Purchases,
  trades?: Trades,
): number;
export function purchasePaidAmount(item?: Partial<PurchaseItem>): number;
export function purchaseUnitPaidAmount(item?: Partial<PurchaseItem>): number;
