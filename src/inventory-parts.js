export const inventoryPartCategories = Object.freeze([
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
  "Complete Combo"
]);
export const inventoryLinesByBladeCategory = Object.freeze({
  Blade: Object.freeze(["BX", "UX"]),
  "Main Blade": Object.freeze(["CX"])
});

export function groupInventoryParts(parts) {
  const grouped = new Map();
  for (const part of parts) {
    const normalizedPart = { ...part, category: canonicalInventoryPartCategory(part.category) };
    const key = [normalizedPart.category, normalizedPart.name, normalizedPart.abbrev].map((value) => String(value ?? "").toLowerCase()).join("|");
    const sources = splitValues(part.source);
    const quantity = Number(part.qty) || 0;
    const isLegacySummary = sources.length > 1 && quantity === sources.length;
    const quantityPerSource = isLegacySummary ? 1 : quantity;
    const current = grouped.get(key) ?? {
      part: normalizedPart,
      notes: new Set(),
      lines: new Set(),
      imageRefs: new Map(),
      sourceQuantities: new Map(),
      legacySourceQuantities: new Map()
    };

    for (const source of sources) {
      const quantities = isLegacySummary ? current.legacySourceQuantities : current.sourceQuantities;
      const previous = quantities.get(source) ?? 0;
      quantities.set(source, isLegacySummary ? Math.max(previous, quantityPerSource) : previous + quantityPerSource);
    }
    if (part.notes && !isLegacySummary) current.notes.add(part.notes);
    for (const line of splitValues(part.line)) current.lines.add(line);
    for (const imageRef of part.imageRefs ?? []) {
      current.imageRefs.set(imageRef.url, imageRef);
    }
    grouped.set(key, current);
  }

  return [...grouped.values()].map(({ part, notes, lines, imageRefs, sourceQuantities, legacySourceQuantities }) => ({
    ...part,
    qty: [...new Set([...sourceQuantities.keys(), ...legacySourceQuantities.keys()])]
      .map((source) => sourceQuantities.get(source) ?? legacySourceQuantities.get(source) ?? 0)
      .reduce((sum, quantity) => sum + quantity, 0),
    line: [...lines].join(", ") || "-",
    source: [...new Set([...sourceQuantities.keys(), ...legacySourceQuantities.keys()])].join("; "),
    imageRefs: [...imageRefs.values()],
    notes: [...notes].join(" ")
  }));
}

export function canonicalInventoryPartCategory(category) {
  return category === "Metal Blade" ? "Main Blade" : category;
}

function splitValues(value) {
  return [...new Set(String(value ?? "").split(";").map((item) => item.trim()).filter(Boolean))];
}
