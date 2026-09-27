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
      sourceQuantities: new Map()
    };

    for (const source of sources) {
      current.sourceQuantities.set(source, Math.max(current.sourceQuantities.get(source) ?? 0, quantityPerSource));
    }
    if (part.notes && !isLegacySummary) current.notes.add(part.notes);
    grouped.set(key, current);
  }

  return [...grouped.values()].map(({ part, notes, sourceQuantities }) => ({
    ...part,
    qty: [...sourceQuantities.values()].reduce((sum, quantity) => sum + quantity, 0),
    source: [...sourceQuantities.keys()].join("; "),
    notes: [...notes].join(" ")
  }));
}

export function canonicalInventoryPartCategory(category) {
  return category === "Metal Blade" ? "Main Blade" : category;
}

function splitValues(value) {
  return [...new Set(String(value ?? "").split(";").map((item) => item.trim()).filter(Boolean))];
}
