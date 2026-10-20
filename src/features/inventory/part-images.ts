import type {
  InventoryPartDetail,
  InventoryPartImageRef,
} from "@/domain/types";

const PHSTUDY = "https://beyblade.phstudy.org/images/thumb/w128";

const partImageType = {
  Blade: ["Blade", "BLADE"],
  "Lock Chip": ["LockChip", "LOCKCHIP"],
  "Main Blade": ["MainBlade", "MAINBLADE"],
  "Metal Blade": ["MetalBlade", "METALBLADE"],
  "Over Blade": ["OverBlade", "OVERBLADE"],
  "Assist Blade": ["AssistBlade", "ASSISTBLADE"],
  Ratchet: ["Ratchet", "RATCHET"],
  Bit: ["Bit", "BIT"],
} as const;

const ttPartImageType = {
  Blade: ["Blade", "BL"],
  "Lock Chip": ["LockChip", "LC"],
  "Main Blade": ["MainBlade", "MB"],
  "Metal Blade": ["MetalBlade", "MT"],
  "Over Blade": ["OverBlade", "OV"],
  "Assist Blade": ["AssistBlade", "AB"],
  Ratchet: ["Ratchet", "RC"],
  Bit: ["Bit", "BT"],
} as const;

const ttReleaseIds: Record<string, string[]> = {
  "Bullet Griffon H": ["096160-00"],
  "Tiga Rage FT3-60T": ["080640-00"],
  "Croco Tread TQ5-50GN": ["080626-01", "080626-02", "080626-03"],
  "Brachio Whip OW5-70Nr": ["096177-01", "096177-02", "096177-03"],
  "Wolf Hunt F0-60DB": ["097242-00"],
  "Aero Pegasus 3-70A Red Ver.": ["096528-00"],
};

const ttVariantReleaseIds: Record<string, string> = {
  "CX-18-01": "096177-01",
  "CX-18-02": "096177-02",
  "CX-18-03": "096177-03",
  "CX-19-01": "080626-01",
  "CX-19-02": "080626-02",
  "CX-19-03": "080626-03",
};

const accessoryImages: Record<string, Record<string, string[]>> = {
  F9324: {
    Launcher: [`${PHSTUDY}/hasbro/F9324/F9324_09.webp`],
  },
  G1536: {
    Launcher: [`${PHSTUDY}/hasbro/G1536/G1536_06.webp`],
  },
  G1537: {
    Launcher: [`${PHSTUDY}/hasbro/G1537/G1537_06.webp`],
  },
  F9588: {
    Stadium: [`${PHSTUDY}/hasbro/F9588/F9588_15.webp`],
    Launcher: [`${PHSTUDY}/hasbro/F9588/F9588_14.webp`],
  },
  G4568: {
    Launcher: [`${PHSTUDY}/hasbro/G4568/G4568_05.webp`],
  },
  G2745: {
    Launcher: [`${PHSTUDY}/hasbro/G2745/G2745_05.webp`],
  },
  G4565: {
    Launcher: [`${PHSTUDY}/hasbro/G4565/G4565_03.webp`],
  },
  G2752: {
    Launcher: [`${PHSTUDY}/hasbro/G2752/G2752_05.webp`],
  },
  G2951: {
    Launcher: [
      `${PHSTUDY}/hasbro/G2951/G2951_04.webp`,
      `${PHSTUDY}/hasbro/G2951/G2951_05.webp`,
    ],
  },
  G2750: {
    Launcher: [`${PHSTUDY}/hasbro/G2750/G2750_05.webp`],
  },
  G3028: {
    Tool: [`${PHSTUDY}/hasbro/G3028/G3028_00.webp`],
  },
  "UX-19": {
    Launcher: [`${PHSTUDY}/products/UX-19/096160_launcher_01.webp`],
  },
  "BXG-70": {
    Launcher: [`${PHSTUDY}/products/BXG-70/080640_launcher_01.webp`],
  },
  "CX-16": {
    Stadium: [`${PHSTUDY}/products/CX-16/097280_stadium_01.webp`],
    Launcher: [`${PHSTUDY}/products/CX-16/097280_launcher_01.webp`],
    Grip: [`${PHSTUDY}/products/CX-16/097280_grip_01.webp`],
  },
  "BX-09": {
    "Battle Pass": [
      "https://beyblade.phstudy.org/images/products/BX-09/905240_00.jpg",
    ],
  },
};

export function inventoryPartImageRefs(
  part: InventoryPartDetail,
): InventoryPartImageRef[] {
  const releaseId = releaseIdForPart(part);
  if (releaseId) {
    const accessory = accessoryImages[releaseId]?.[part.category];
    if (accessory) return accessory.map((url) => exactRef(url, releaseId));

    const type = partImageType[part.category as keyof typeof partImageType];
    if (type) {
      const [directory, suffix] = type;
      return [
        exactRef(
          `${PHSTUDY}/site/${directory}/HB-${releaseId}-${suffix}.webp`,
          releaseId,
        ),
      ];
    }
  }

  const exactTtId = part.code
    ? ttVariantReleaseIds[part.code.toUpperCase()]
    : undefined;
  const ttIds = exactTtId ? [exactTtId] : ttReleaseIds[part.source ?? ""];
  const ttType = ttPartImageType[part.category as keyof typeof ttPartImageType];
  if (!ttIds || !ttType) {
    const fallback = accessoryFallback(part);
    return fallback ? [fallback] : [];
  }

  const [directory, prefix] = ttType;
  const variant = ttIds.length === 1 ? "exact" : "unknown";
  return ttIds.map((id) => ({
    url: `${PHSTUDY}/site/${directory}/${prefix}-PRD-${id}.webp`,
    source: "beyblade.phstudy.org",
    variant,
    releaseId: id,
  }));
}

function releaseIdForPart(part: InventoryPartDetail): string | undefined {
  if (part.source === "Xtreme Battle Set") {
    if (/Dagger Dran|4-60|Rush/.test(`${part.name} ${part.abbrev}`))
      return "F9588-01";
    if (/Tusk Mammoth|3-60|Taper/.test(`${part.name} ${part.abbrev}`))
      return "F9588-02";
    return "F9588";
  }

  return part.code?.match(/\b[FG]\d{4}(?:-\d{2})?\b/i)?.[0].toUpperCase();
}

function accessoryFallback(
  part: InventoryPartDetail,
): InventoryPartImageRef | undefined {
  if (part.source === "Tiga Rage FT3-60T" && part.category === "Launcher")
    return exactRef(accessoryImages["BXG-70"].Launcher[0], "BXG-70");
  if (part.source === "CX-16 Start Dash Set C") {
    const url = accessoryImages["CX-16"]?.[part.category]?.[0];
    if (url) return exactRef(url, "CX-16");
  }
  if (part.source === "Bullet Griffon H" && part.category === "Launcher")
    return exactRef(accessoryImages["UX-19"].Launcher[0], "UX-19");
  if (part.source === "BX-09 Beybattle Pass" && part.category === "Battle Pass")
    return exactRef(accessoryImages["BX-09"]["Battle Pass"][0], "BX-09");
  return undefined;
}

function exactRef(url: string, releaseId: string): InventoryPartImageRef {
  return {
    url,
    source: "beyblade.phstudy.org",
    variant: "exact",
    releaseId,
  };
}
