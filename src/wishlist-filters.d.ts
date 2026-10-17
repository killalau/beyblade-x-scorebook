import type { WishlistItem } from "./domain/types";

export interface PartFilterOptions {
  requestedParts?: string[];
  partType?: string;
  matchAll?: boolean;
  onlyMissing?: boolean;
}

export function matchesPartFilters(
  item: WishlistItem,
  options?: PartFilterOptions,
): boolean;
export function partFilterTokens(value: unknown): string[];
