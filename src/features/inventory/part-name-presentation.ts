import type { InventoryPartDetail } from "@/domain/types";
import { supportsRegionalChineseName } from "@/inventory-parts.js";

export interface AlternatePartName {
  label: string;
  value: string;
}

export interface PartNamePresentation {
  primary: string;
  secondary: string | null;
  alternates: AlternatePartName[];
}

export function presentPartNames(
  part: InventoryPartDetail,
): PartNamePresentation {
  if (!supportsRegionalChineseName(part.category)) {
    return { primary: part.name || "-", secondary: null, alternates: [] };
  }

  const names = part.names;
  const primary = names?.["en-US"] || part.name || names?.["en-JP"] || "-";
  const secondary = names?.["zh-HK"] || null;
  const alternates = [
    { label: "EN-JP (TT)", value: names?.["en-JP"] },
    { label: "台灣中文", value: names?.["zh-TW"] },
  ].filter((item): item is AlternatePartName => Boolean(item.value));

  return { primary, secondary, alternates };
}
