import type { PurchaseItem, Purchases } from "./domain/types";

export function calculateTotalSpend(purchases?: Purchases): number;
export function purchasePaidAmount(item?: Partial<PurchaseItem>): number;
export function purchaseUnitPaidAmount(item?: Partial<PurchaseItem>): number;
