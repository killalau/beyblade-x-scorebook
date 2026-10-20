export type CurrencyCode = "CAD" | "HKD" | (string & {});

export type InventoryPartCategory =
  | "Blade"
  | "Lock Chip"
  | "Main Blade"
  | "Over Blade"
  | "Assist Blade"
  | "Ratchet"
  | "Bit"
  | "Launcher"
  | "Grip"
  | "Stadium"
  | "Battle Pass"
  | "Tool"
  | "Complete Combo";

export interface InventoryPartDetail {
  category: InventoryPartCategory | "Metal Blade";
  name: string;
  abbrev?: string;
  code?: string;
  qty?: number | string;
  source?: string;
  sourceUrl?: string;
  notes?: string;
  line?: string;
  imageRefs?: InventoryPartImageRef[];
}

export interface InventoryPartImageRef {
  url: string;
  source: "beyblade.phstudy.org";
  variant: "exact" | "unknown";
  releaseId: string;
}

export interface Inventory {
  parts: string[];
  beys: string[];
  partsDetail?: InventoryPartDetail[];
}

export interface SoldItem {
  name?: string;
  salePrice?: number | string;
  soldAt?: string;
}

export interface ReturnedItem {
  name?: string;
  refundAmount?: number | string;
  returnedAt?: string;
}

export interface GiftedItem {
  name?: string;
  giftedAt?: string;
}

export interface PurchaseItem {
  name: string;
  source?: string;
  purchaseDate?: string;
  pretaxPrice?: number | string;
  taxRate?: number | string;
  taxIncluded?: boolean;
  estimatedTotalPaid?: number | string;
  perItemTotal?: number | string;
  quantity?: number | string;
  imageUrl?: string;
  preorder?: boolean;
  status?: string;
  recordedFrom?: string;
  soldItems?: SoldItem[];
  returnedItems?: ReturnedItem[];
  giftedItems?: GiftedItem[];
  notes?: string;
}

export interface Purchases {
  items: PurchaseItem[];
}

export interface CollectionData {
  version: 1;
  currency?: CurrencyCode;
  taxRegion?: string;
  sourcePreferences?: {
    market?: string;
    defaultBrand?: string;
    defaultBrandCondition?: string;
    explicitTakaraTomyProducts?: string[];
    explicitHasbroProducts?: string[];
  };
  inventory: Inventory;
  purchases: Purchases;
}

export type AvailabilityStatus =
  | "available_now"
  | "preorder"
  | "delayed"
  | "backorder"
  | "out_of_stock"
  | "unavailable"
  | "not_observed"
  | "unknown";

export type NormalizationStatus = "verified" | "needs_review";

export interface RetailerListing {
  listingId: string;
  retailer: string;
  name: string;
  url: string;
  configs: string[];
  availabilityStatus: AvailabilityStatus;
  orderable: boolean;
  normalizationStatus?: NormalizationStatus;
  productId?: string;
  price?: number | string;
  currency?: CurrencyCode;
  statusLabel?: string;
  bundleType?: string;
  includedBeys?: string;
  cxMode?: boolean;
  imageUrl?: string;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  lastAvailableAt?: string | null;
}

export interface RetailerCatalogue {
  currency?: CurrencyCode;
  generatedAt?: string;
  items: RetailerListing[];
}

export type ScoredPartType =
  "blade" | "lockChip" | "overBlade" | "assistBlade" | "ratchet" | "bit";

export interface ParsedPart {
  name: string;
  type: ScoredPartType;
  raw?: string;
  displayName?: string;
}

export interface ScoredPart extends ParsedPart {
  rankClass: string;
  rankSource: string;
  rankDetail: string;
  rankScore: number;
  typeWeight: number;
  partScore: number;
  rarity: "owned" | "rare" | "normal";
  rarityMultiplier: number;
  costContribution: number;
}

export interface ScoredProduct {
  name: string;
  configs: string[];
  price: number | null;
  score: number;
  costIndex: number | null;
  parts: ScoredPart[];
}

export interface WishlistPart {
  name: string;
  type: ScoredPartType;
  owned?: boolean;
  rankClass?: string;
  fused?: boolean;
}

export interface WishlistItem {
  name: string;
  price?: number | string;
  retailer?: string;
  status?: string;
  bundleType?: string;
  includedBeys?: string;
  configs?: string | string[];
  usefulParts?: string;
  helpsInventory?: string;
  imageUrl?: string;
  createdAt?: string;
  url?: string;
  notes?: string;
  score?: number | string;
  costIndex?: number | string | null;
  parts?: WishlistPart[];
}

export interface WishlistData {
  currency?: CurrencyCode;
  items: WishlistItem[];
}

export interface ScoringOptions {
  cxMode?: boolean;
  ownedParts?: string[];
  rareParts?: string[];
}
