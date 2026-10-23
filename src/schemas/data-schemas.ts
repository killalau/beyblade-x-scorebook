import { z } from "zod";

const numberLike = z.union([
  z.number().finite(),
  z
    .string()
    .refine(
      (value) => Number.isFinite(Number(value)),
      "Expected a numeric value",
    ),
]);
const optionalNumberLike = numberLike.optional();
const nonNegativeNumberLike = numberLike.refine(
  (value) => Number(value) >= 0,
  "Expected a non-negative numeric value",
);
const positiveNumberLike = numberLike.refine(
  (value) => Number(value) > 0,
  "Expected a numeric value greater than zero",
);

export const beybladeBrandSchema = z.enum(["Hasbro", "Takara Tomy"]);

export const inventoryPartNamesSchema = z.object({
  "en-US": z.string().nullable(),
  "en-JP": z.string().nullable(),
  "zh-TW": z.string().nullable(),
  "zh-HK": z.string().nullable(),
});

export const inventoryPartCategorySchema = z.enum([
  "Blade",
  "Lock Chip",
  "Main Blade",
  "Over Blade",
  "Assist Blade",
  "Ratchet",
  "Bit",
  "Launcher",
  "Grip",
  "Stadium",
  "Battle Pass",
  "Tool",
  "Complete Combo",
]);

export const inventoryPartDetailSchema = z
  .looseObject({
    category: inventoryPartCategorySchema,
    name: z.string(),
    names: inventoryPartNamesSchema.optional(),
    brand: beybladeBrandSchema.optional(),
    abbrev: z.string().optional(),
    code: z.string().optional(),
    qty: optionalNumberLike,
    source: z.string().optional(),
    sourceUrl: z.string().optional(),
    notes: z.string().optional(),
    line: z.string().optional(),
    bladeSystem: z.enum(["standard", "expand"]).optional(),
    type: z.string().optional(),
  })
  .superRefine((part, context) => {
    if (part.category === "Blade" || part.category === "Main Blade") {
      const allowed = part.category === "Blade" ? ["BX", "UX"] : ["CX"];
      if (!part.line || !allowed.includes(part.line)) {
        context.addIssue({
          code: "custom",
          path: ["line"],
          message: `${part.category} line must be one of: ${allowed.join(", ")}`,
        });
      }
    } else if (part.line !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["line"],
        message: "Line is only valid for Blade and Main Blade rows",
      });
    }
    if (
      part.bladeSystem !== undefined &&
      part.category !== "Blade" &&
      part.category !== "Main Blade"
    ) {
      context.addIssue({
        code: "custom",
        path: ["bladeSystem"],
        message: "Blade system is only valid for Blade and Main Blade rows",
      });
    }
    if (
      part.category === "Bit" &&
      part.type !== undefined &&
      !["Attack", "Defense", "Stamina", "Balance"].includes(part.type)
    ) {
      context.addIssue({
        code: "custom",
        path: ["type"],
        message: "Bit type must be Attack, Defense, Stamina, or Balance",
      });
    }
  });

export const inventorySchema = z.looseObject({
  parts: z.array(z.string()),
  beys: z.array(z.string()),
  partsDetail: z.array(inventoryPartDetailSchema).optional(),
});

const soldItemSchema = z.looseObject({
  name: z.string().optional(),
  salePrice: optionalNumberLike,
  soldAt: z.string().optional(),
});

const returnedItemSchema = z.looseObject({
  name: z.string().optional(),
  refundAmount: numberLike,
  returnedAt: z.string().optional(),
});

const giftedItemSchema = z.looseObject({
  name: z.string().optional(),
  giftedAt: z.string().optional(),
});

export const purchaseItemSchema = z.looseObject({
  acquisitionId: z.string().optional(),
  name: z.string(),
  brand: beybladeBrandSchema.optional(),
  source: z.string().optional(),
  purchaseDate: z.string().optional(),
  pretaxPrice: optionalNumberLike,
  taxRate: optionalNumberLike,
  taxIncluded: z.boolean().optional(),
  estimatedTotalPaid: optionalNumberLike,
  perItemTotal: optionalNumberLike,
  quantity: optionalNumberLike,
  imageUrl: z.string().optional(),
  preorder: z.boolean().optional(),
  soldItems: z.array(soldItemSchema).optional(),
  returnedItems: z.array(returnedItemSchema).optional(),
  giftedItems: z.array(giftedItemSchema).optional(),
  notes: z.string().optional(),
});

const tradeGivenItemSchema = z.looseObject({
  name: z.string(),
  quantity: positiveNumberLike.optional(),
  fromAcquisitionId: z.string(),
  transferredCostBasis: nonNegativeNumberLike,
});

const tradeReceivedItemSchema = z.looseObject({
  acquisitionId: z.string(),
  name: z.string(),
  brand: beybladeBrandSchema,
  quantity: positiveNumberLike.optional(),
  costBasis: nonNegativeNumberLike,
  imageUrl: z.string(),
});

export const tradeRecordSchema = z
  .looseObject({
    tradeId: z.string(),
    tradedAt: z.string(),
    source: z.string().optional(),
    gave: z.array(tradeGivenItemSchema).min(1),
    received: z.array(tradeReceivedItemSchema).min(1),
    cashPaid: nonNegativeNumberLike.optional(),
    cashReceived: nonNegativeNumberLike.optional(),
    notes: z.string().optional(),
  })
  .superRefine((trade, context) => {
    if (
      Number(trade.cashPaid ?? 0) > 0 &&
      Number(trade.cashReceived ?? 0) > 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["cashReceived"],
        message: "A trade must use only cashPaid or cashReceived",
      });
    }
  });

export const collectionSchema = z
  .looseObject({
    version: z.literal(1),
    currency: z.string().optional(),
    taxRegion: z.string().nullable().optional(),
    sourcePreferences: z
      .looseObject({
        market: z.string().optional(),
        defaultBrand: z.string().optional(),
        defaultBrandCondition: z.string().optional(),
        explicitTakaraTomyProducts: z.array(z.string()).optional(),
        explicitHasbroProducts: z.array(z.string()).optional(),
      })
      .optional(),
    inventory: inventorySchema,
    purchases: z.looseObject({ items: z.array(purchaseItemSchema) }),
    trades: z.looseObject({ items: z.array(tradeRecordSchema) }).optional(),
  })
  .superRefine((collection, context) => {
    const acquisitionIds = new Set<string>();
    for (const [index, purchase] of collection.purchases.items.entries()) {
      if (!purchase.acquisitionId) continue;
      if (acquisitionIds.has(purchase.acquisitionId)) {
        context.addIssue({
          code: "custom",
          path: ["purchases", "items", index, "acquisitionId"],
          message: "Acquisition IDs must be unique",
        });
      }
      acquisitionIds.add(purchase.acquisitionId);
    }
    for (const [tradeIndex, trade] of (
      collection.trades?.items ?? []
    ).entries()) {
      for (const [itemIndex, item] of trade.received.entries()) {
        if (acquisitionIds.has(item.acquisitionId)) {
          context.addIssue({
            code: "custom",
            path: [
              "trades",
              "items",
              tradeIndex,
              "received",
              itemIndex,
              "acquisitionId",
            ],
            message: "Acquisition IDs must be unique",
          });
        }
        acquisitionIds.add(item.acquisitionId);
      }
    }
    for (const [tradeIndex, trade] of (
      collection.trades?.items ?? []
    ).entries()) {
      trade.gave.forEach((item, itemIndex) => {
        if (!acquisitionIds.has(item.fromAcquisitionId)) {
          context.addIssue({
            code: "custom",
            path: [
              "trades",
              "items",
              tradeIndex,
              "gave",
              itemIndex,
              "fromAcquisitionId",
            ],
            message: "Trade must reference an existing acquisition",
          });
        }
      });
      const transferred = trade.gave.reduce(
        (sum, item) => sum + Number(item.transferredCostBasis),
        0,
      );
      const received = trade.received.reduce(
        (sum, item) => sum + Number(item.costBasis),
        0,
      );
      const expected =
        transferred +
        Number(trade.cashPaid ?? 0) -
        Number(trade.cashReceived ?? 0);
      if (Math.abs(received - expected) > 0.01) {
        context.addIssue({
          code: "custom",
          path: ["trades", "items", tradeIndex, "received"],
          message:
            "Received cost basis must equal transferred basis plus cash paid minus cash received",
        });
      }
    }
  });

export const wishlistPartSchema = z.looseObject({
  name: z.string(),
  type: z.string(),
  owned: z.boolean(),
  rankClass: z.string().optional(),
  fused: z.boolean().optional(),
});

export const wishlistItemSchema = z.looseObject({
  listingId: z.string().optional(),
  name: z.string(),
  price: optionalNumberLike,
  retailer: z.string().optional(),
  status: z.string().optional(),
  bundleType: z.string().optional(),
  includedBeys: z.string().optional(),
  configs: z.union([z.string(), z.array(z.string())]).optional(),
  parts: z.array(wishlistPartSchema).optional(),
  usefulParts: z.string().optional(),
  helpsInventory: z.string().optional(),
  imageUrl: z.string().optional(),
  createdAt: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
  score: optionalNumberLike,
  costIndex: z.union([numberLike, z.null()]).optional(),
});

export const wishlistSchema = z.looseObject({
  currency: z.string().optional(),
  items: z.array(wishlistItemSchema),
});

export const availabilityStatusSchema = z.enum([
  "available_now",
  "preorder",
  "delayed",
  "backorder",
  "out_of_stock",
  "unavailable",
  "not_observed",
  "unknown",
]);

export const catalogueItemSchema = z.looseObject({
  listingId: z.string().min(1),
  retailer: z.string(),
  name: z.string(),
  url: z.string(),
  configs: z.array(z.string()),
  availabilityStatus: availabilityStatusSchema,
  orderable: z.boolean(),
  normalizationStatus: z.enum(["verified", "needs_review"]).optional(),
  productId: z.string().optional(),
  price: optionalNumberLike,
  currency: z.string().optional(),
  statusLabel: z.string().optional(),
  bundleType: z.string().optional(),
  includedBeys: z.string().optional(),
  cxMode: z.boolean().optional(),
  imageUrl: z.string().optional(),
  firstSeenAt: z.string().nullable().optional(),
  lastSeenAt: z.string().nullable().optional(),
  lastAvailableAt: z.string().nullable().optional(),
});

export const publicCatalogueSchema = z
  .looseObject({
    version: z.literal(1),
    currency: z.string().optional(),
    generatedAt: z.string().optional(),
    items: z.array(catalogueItemSchema),
  })
  .superRefine((catalogue, context) => {
    catalogue.items.forEach((item, index) => {
      for (const privateField of ["notes", "availabilityText"]) {
        if (privateField in item) {
          context.addIssue({
            code: "custom",
            path: ["items", index, privateField],
            message: `Public catalogue must not expose ${privateField}`,
          });
        }
      }
    });
  });

export type CollectionInput = z.infer<typeof collectionSchema>;
export type WishlistInput = z.infer<typeof wishlistSchema>;
export type PublicCatalogueInput = z.infer<typeof publicCatalogueSchema>;

export function formatValidationError(error: z.ZodError): string {
  return error.issues
    .slice(0, 4)
    .map((issue) => `${issue.path.join(".") || "JSON"}: ${issue.message}`)
    .join("; ");
}
