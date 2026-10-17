import type {
  InventoryPartCategory,
  InventoryPartDetail,
} from "./domain/types";

export const inventoryPartCategories: readonly InventoryPartCategory[];
export const inventoryLinesByBladeCategory: Readonly<
  Record<"Blade" | "Main Blade", readonly string[]>
>;
export function groupInventoryParts(
  parts: InventoryPartDetail[],
): InventoryPartDetail[];
export function canonicalInventoryPartCategory(category: string): string;
