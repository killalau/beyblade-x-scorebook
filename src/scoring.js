import {
  aliases,
  assistBladeCodes,
  bitNames,
  fusedBitCodes,
  lockChipNames,
  overBladeCodes
} from "./reference-data/names.js";
import {
  partTypeWeights,
  rankScores,
  rarityMultipliers
} from "./reference-data/scoringConfig.js";
import { partsRanking as gamerPostPartsRanking } from "./reference-data/rankings/gamerPost.js";
import { partsRanking as bbxWeeklyPartsRanking } from "./reference-data/rankings/bbxWeekly.js";

const partIndex = buildPartIndex();

export function normalizePartName(name) {
  const trimmed = String(name || "").trim();
  return aliases[trimmed] || trimmed;
}

export function parseConfig(configText, options = {}) {
  const text = String(configText || "").replace(/\s+/g, " ").trim();
  const cxMode = options.cxMode === true;
  const integratedCxMatch = cxMode
    ? text.match(/^(.+?)\s+([^\s]+)\s+([A-Z])\s*([A-Z][a-z])$/)
    : null;
  const fusedBit = canonicalFusedBit(integratedCxMatch?.[4]);
  if (integratedCxMatch && fusedBit && isValidCxCode(integratedCxMatch[3].toUpperCase())) {
    const [, mainBlade, lockChip, assistBlade] = integratedCxMatch;
    return [
      { name: normalizePartName(mainBlade), type: "blade", raw: mainBlade },
      { name: normalizePartName(lockChip), type: "lockChip", raw: lockChip },
      ...parseCxCode(assistBlade.toUpperCase()),
      { name: fusedBit, type: "bit", raw: integratedCxMatch[4], displayName: `${fusedBit} (Fused)` }
    ];
  }
  const ratchetMatch = cxMode
    ? text.match(/\b([A-Z]{0,3})((?:\d|M)-\d{2})([A-Z]{1,3})\b/)
    : text.match(/\b((?:\d|M)-\d{2})([A-Z]{1,3})\b/);
  if (!ratchetMatch) {
    return [{ name: normalizePartName(text), type: "blade", raw: text }];
  }

  const attachedCxCode = cxMode ? ratchetMatch[1] : "";
  const ratchet = cxMode ? ratchetMatch[2] : ratchetMatch[1];
  const bit = cxMode ? ratchetMatch[3] : ratchetMatch[2];
  const before = text.slice(0, ratchetMatch.index).trim();
  const tokens = before.split(" ").filter(Boolean);
  const parts = [];

  const cxCode = tokens.at(-1);
  const cxCodeLooksSeparate = cxMode && isValidCxCode(cxCode);
  const nameTokens = cxCodeLooksSeparate ? tokens.slice(0, -1) : tokens;
  const bladeName = inferBladeName(nameTokens, cxMode);
  if (bladeName) {
    parts.push({ name: normalizePartName(bladeName), type: "blade", raw: bladeName });
  }

  if (cxMode && nameTokens.length > 1 && isLikelyLockChip(nameTokens.at(-1))) {
    const lockChip = nameTokens.at(-1);
    parts.push({ name: normalizePartName(lockChip), type: "lockChip", raw: lockChip });
  }

  const cxCodeToParse = isValidCxCode(attachedCxCode) ? attachedCxCode : (cxCodeLooksSeparate ? cxCode : "");
  if (cxCodeToParse) {
    const cxParts = parseCxCode(cxCodeToParse);
    parts.push(...cxParts);
  }

  parts.push({ name: ratchet, type: "ratchet", raw: ratchet });
  parts.push({ name: bit, type: "bit", raw: bit, displayName: bitNames[bit] || bit });
  return parts;
}

export function parseProduct(input, options = {}) {
  return String(input || "")
    .split(",")
    .map((piece) => piece.trim())
    .filter(Boolean)
    .flatMap((piece) => parseConfig(piece, options));
}

export function scorePart(part, options = {}) {
  const normalized = normalizePartName(part.name);
  const typedKey = makeKey(normalized, part.type);
  const genericKey = makeKey(normalized, "");
  const rank = partIndex.get(typedKey) || partIndex.get(genericKey);
  const rankClass = rank?.rankClass || defaultRankClass(part);
  const rankScore = rankScores[rankClass] || 0;
  const typeWeight = partTypeWeights[part.type] || 1;
  const partScore = rankScore * typeWeight;
  const owned = isOwned(normalized, options.ownedParts);
  const rare = isRare(normalized, options.rareParts);
  const rarity = owned ? "owned" : rare ? "rare" : "normal";
  const costContribution = partScore * rarityMultipliers[rarity];

  return {
    ...part,
    name: normalized,
    rankClass,
    rankSource: rank?.source || "-",
    rankDetail: rank?.detail || "-",
    rankScore,
    typeWeight,
    partScore,
    rarity,
    rarityMultiplier: rarityMultipliers[rarity],
    costContribution
  };
}

export function scoreProduct({ name, configs, price }, options = {}) {
  const parsedParts = (configs?.length ? configs : [name]).flatMap((config) => parseProduct(config, options));
  const parts = parsedParts.map((part) => scorePart(part, options));
  const score = round(parts.reduce((sum, part) => sum + part.partScore, 0));
  const denominator = parts.reduce((sum, part) => sum + part.costContribution, 0);
  const numericPrice = Number(price);
  const costIndex = denominator > 0 && Number.isFinite(numericPrice)
    ? round((numericPrice / denominator) * 5)
    : null;

  return {
    name,
    configs: configs || [name],
    price: Number.isFinite(numericPrice) ? numericPrice : null,
    score,
    costIndex,
    parts
  };
}

export function summarizeBreakdown(scored) {
  return scored.parts.map((part) => ({
    part: part.name,
    type: part.type,
    rank: part.rankClass,
    score: part.partScore,
    rarity: part.rarity,
    costContribution: part.costContribution,
    source: part.rankSource
  }));
}

function buildPartIndex() {
  const index = new Map();
  for (const part of bbxWeeklyPartsRanking) {
    setBest(index, part.name, part.type, {
      rankClass: part.rankClass,
      source: "BBX Weekly",
      detail: `#${part.rank}`
    });
  }
  for (const part of gamerPostPartsRanking) {
    setBest(index, part.name, part.type, {
      rankClass: part.rankClass,
      source: "Gamer Image",
      detail: part.tier
    });
  }
  return index;
}

function setBest(index, name, type, rank) {
  const key = makeKey(normalizePartName(name), type);
  const current = index.get(key);
  if (!current || (rankScores[rank.rankClass] || 0) > (rankScores[current.rankClass] || 0)) {
    index.set(key, rank);
  }
}

function makeKey(name, type) {
  return `${String(name).toLowerCase()}|${type || ""}`;
}

function defaultRankClass(part) {
  if (part.type === "lockChip" && /^metal/i.test(part.name)) return "S";
  if (part.type === "lockChip") return "C";
  return "-";
}

function inferBladeName(tokens, cxMode) {
  if (!tokens.length) return "";
  if (cxMode && tokens.length >= 2 && isLikelyLockChip(tokens.at(-1))) {
    return tokens.slice(0, -1).join(" ");
  }
  return tokens.join(" ");
}

function isLikelyLockChip(token) {
  return lockChipNames.includes(token);
}

function parseCxCode(code) {
  if (code.length === 1) {
    return [{ name: assistBladeCodes[code] || code, type: "assistBlade", raw: code }];
  }
  if (code.length === 2) {
    const [over, assist] = code;
    return [
      { name: overBladeCodes[over] || over, type: "overBlade", raw: over },
      { name: assistBladeCodes[assist] || assist, type: "assistBlade", raw: assist }
    ];
  }
  return [{ name: code, type: "assistBlade", raw: code }];
}

function isValidCxCode(code) {
  if (!code) return false;
  if (code.length === 1) return Object.hasOwn(assistBladeCodes, code);
  if (code.length === 2) {
    const [over, assist] = code;
    return Object.hasOwn(overBladeCodes, over) && Object.hasOwn(assistBladeCodes, assist);
  }
  return false;
}

function canonicalFusedBit(code) {
  const key = Object.keys(fusedBitCodes).find((candidate) => candidate.toLowerCase() === String(code || "").toLowerCase());
  return key ? fusedBitCodes[key] : "";
}

function isOwned(name, ownedParts = []) {
  const normalized = normalizePartName(name).toLowerCase();
  return new Set(ownedParts.map((part) => normalizePartName(part).toLowerCase())).has(normalized);
}

function isRare(name, rareParts = []) {
  const normalized = normalizePartName(name).toLowerCase();
  return new Set(rareParts.map((part) => normalizePartName(part).toLowerCase())).has(normalized);
}

function round(value) {
  return Math.round(value * 100) / 100;
}
