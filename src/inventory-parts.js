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

const knownInventoryProductLines = Object.freeze([
  ["CX", /\b(fang leon)\b/i],
  ["UX", /\b(tide whale|circle ghost|hack viking|cowl sphinx|crest leon|shark scale|cobalt dragoon|deluxe launcher 2-pack)\b/i],
  ["BX", /\b(xtreme battle set|brace triceratops|dagger dran)\b/i]
]);

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
      sourceQuantities: new Map()
    };

    for (const source of sources) {
      current.sourceQuantities.set(source, Math.max(current.sourceQuantities.get(source) ?? 0, quantityPerSource));
    }
    if (part.notes && !isLegacySummary) current.notes.add(part.notes);
    for (const line of splitValues(part.line)) current.lines.add(line);
    grouped.set(key, current);
  }

  return [...grouped.values()].map(({ part, notes, lines, sourceQuantities }) => ({
    ...part,
    qty: [...sourceQuantities.values()].reduce((sum, quantity) => sum + quantity, 0),
    line: [...lines].join(", ") || "-",
    source: [...sourceQuantities.keys()].join("; "),
    notes: [...notes].join(" ")
  }));
}

export function annotateInventoryPartLines(parts) {
  const lineHintsByCode = new Map();
  for (const part of parts) {
    const code = normalizedCode(part.code);
    const line = directInventoryPartLine(part);
    if (!code || !line) continue;
    const hints = lineHintsByCode.get(code) ?? new Set();
    hints.add(line);
    lineHintsByCode.set(code, hints);
  }

  return parts.map((part) => {
    const directLine = directInventoryPartLine(part);
    const codeHints = lineHintsByCode.get(normalizedCode(part.code));
    return { ...part, line: directLine || (codeHints ? [...codeHints].join(", ") : "-") };
  });
}

export function directInventoryPartLine(part) {
  const explicitLine = String(part?.line ?? "").toUpperCase();
  if (["BX", "UX", "CX"].includes(explicitLine)) return explicitLine;

  const code = normalizedCode(part?.code);
  const codeLine = code.match(/^(BX|UX|CX)(?:-|\b)/)?.[1];
  if (codeLine) return codeLine;

  const text = [part?.category, part?.name, part?.source, part?.notes]
    .filter(Boolean).join(" ").toLowerCase();
  if (/\b(custom line|cx)\b/.test(text) || ["Lock Chip", "Main Blade", "Over Blade", "Assist Blade"].includes(part?.category)) return "CX";
  if (/\b(unique line|ux|infinity|expand blade|ratchet-integrated)\b/.test(text)) return "UX";
  if (/\b(basic line|bx)\b/.test(text)) return "BX";
  const knownLine = knownInventoryProductLines.find(([, pattern]) => pattern.test(text));
  if (knownLine) return knownLine[0];
  return "";
}

export function canonicalInventoryPartCategory(category) {
  return category === "Metal Blade" ? "Main Blade" : category;
}

function splitValues(value) {
  return [...new Set(String(value ?? "").split(";").map((item) => item.trim()).filter(Boolean))];
}

function normalizedCode(value) {
  return String(value ?? "").trim().toUpperCase();
}
