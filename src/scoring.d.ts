import type {
  ParsedPart,
  ScoredPart,
  ScoredProduct,
  ScoringOptions,
} from "./domain/types";

export function normalizePartName(name: unknown): string;
export function parseConfig(
  configText: unknown,
  options?: ScoringOptions,
): ParsedPart[];
export function parseProduct(
  input: unknown,
  options?: ScoringOptions,
): ParsedPart[];
export function scorePart(
  part: ParsedPart,
  options?: ScoringOptions,
): ScoredPart;
export function scoreProduct(
  product: { name: string; configs?: string[]; price?: number | string | null },
  options?: ScoringOptions,
): ScoredProduct;
export function summarizeBreakdown(scored: ScoredProduct): Array<{
  part: string;
  type: string;
  rank: string;
  score: number;
  rarity: string;
  costContribution: number;
  source: string;
}>;
