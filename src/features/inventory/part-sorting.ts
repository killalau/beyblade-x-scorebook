import type { InventoryPartDetail } from "@/domain/types";
import { presentPartNames } from "@/features/inventory/part-name-presentation";

export type InventoryPartSortKey = "line" | "name" | "abbrev" | "qty";
export type SortDirection = "ascending" | "descending";

export interface InventoryPartSort {
  key: InventoryPartSortKey;
  direction: SortDirection;
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export function sortInventoryParts(
  parts: InventoryPartDetail[],
  sort: InventoryPartSort | null,
): InventoryPartDetail[] {
  if (!sort) return parts;

  return parts
    .map((part, index) => ({ index, part }))
    .sort((left, right) => {
      const leftValue = sortValue(left.part, sort.key);
      const rightValue = sortValue(right.part, sort.key);
      const missingOrder = compareMissing(leftValue, rightValue);
      if (missingOrder !== null)
        return missingOrder || left.index - right.index;

      const comparison =
        sort.key === "qty"
          ? Number(leftValue) - Number(rightValue)
          : collator.compare(String(leftValue), String(rightValue));
      return comparison
        ? comparison * (sort.direction === "ascending" ? 1 : -1)
        : left.index - right.index;
    })
    .map(({ part }) => part);
}

function sortValue(part: InventoryPartDetail, key: InventoryPartSortKey) {
  if (key === "qty") {
    const quantity = Number(part.qty);
    return Number.isFinite(quantity) ? quantity : null;
  }
  if (key === "name") return presentPartNames(part).primary;
  return part[key];
}

function compareMissing(
  left: string | number | null | undefined,
  right: string | number | null | undefined,
): number | null {
  const leftMissing =
    left === null || left === undefined || left === "" || left === "-";
  const rightMissing =
    right === null || right === undefined || right === "" || right === "-";
  if (!leftMissing && !rightMissing) return null;
  if (leftMissing && rightMissing) return 0;
  return leftMissing ? 1 : -1;
}
