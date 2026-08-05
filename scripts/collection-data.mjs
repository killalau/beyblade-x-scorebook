export function combineLegacyCollection(inventory, purchases) {
  return {
    version: 1,
    currency: purchases.currency || "CAD",
    taxRegion: purchases.taxRegion || null,
    inventory: {
      parts: inventory.parts || [],
      beys: inventory.beys || [],
      partsDetail: inventory.partsDetail || []
    },
    purchases: {
      items: purchases.items || []
    }
  };
}

export function inventoryFromCollection(collection) {
  return collection.inventory;
}
