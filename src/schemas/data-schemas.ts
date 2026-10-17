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
    abbrev: z.string().optional(),
    qty: optionalNumberLike,
    source: z.string().optional(),
    notes: z.string().optional(),
    line: z.string().optional(),
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
  name: z.string(),
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

export const collectionSchema = z.looseObject({
  version: z.literal(1),
  currency: z.string().optional(),
  taxRegion: z.string().nullable().optional(),
  inventory: inventorySchema,
  purchases: z.looseObject({ items: z.array(purchaseItemSchema) }),
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
  firstSeenAt: z.string().optional(),
  lastSeenAt: z.string().optional(),
  lastAvailableAt: z.string().optional(),
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
