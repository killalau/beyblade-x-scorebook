export const rankScores = {
  S: 5,
  "A+": 4,
  A: 3,
  "A-": 2,
  "B+": 1,
  B: 0,
  C: 0,
  D: 0,
  E: 0
};

export const partTypeWeights = {
  blade: 1.5,
  ratchet: 1,
  bit: 1,
  lockChip: 1,
  overBlade: 0.5,
  assistBlade: 0.5
};

export const rarityMultipliers = {
  owned: 0,
  normal: 1,
  rare: 1.5
};

export const bbxWeeklyParts = [
  { name: "Shark Scale", type: "blade", rank: 1, rankClass: "S" },
  { name: "Silver Wolf", type: "blade", rank: 2, rankClass: "S" },
  { name: "Dran Buster", type: "blade", rank: 3, rankClass: "A+" },
  { name: "Wizard Rod", type: "blade", rank: 4, rankClass: "A+" },
  { name: "Samurai Saber", type: "blade", rank: 5, rankClass: "A+" },
  { name: "Phoenix Wing", type: "blade", rank: 6, rankClass: "A" },
  { name: "Aero Pegasus", type: "blade", rank: 7, rankClass: "A" },
  { name: "Rage", type: "blade", rank: 8, rankClass: "A" },
  { name: "Cobalt Dragoon", type: "blade", rank: 9, rankClass: "A" },

  { name: "LR", type: "bit", rank: 1, rankClass: "S" },
  { name: "E", type: "bit", rank: 2, rankClass: "S" },
  { name: "R", type: "bit", rank: 3, rankClass: "A+" },
  { name: "Rush", type: "bit", rank: 3, rankClass: "A+" },
  { name: "B", type: "bit", rank: 4, rankClass: "A+" },
  { name: "Ball", type: "bit", rank: 4, rankClass: "A+" },
  { name: "T", type: "bit", rank: 5, rankClass: "A+" },
  { name: "Taper", type: "bit", rank: 5, rankClass: "A+" },
  { name: "U", type: "bit", rank: 10, rankClass: "A-" },
  { name: "Unite", type: "bit", rank: 10, rankClass: "A-" },
  { name: "DB", type: "bit", rank: 14, rankClass: "A-" },
  { name: "GF", type: "bit", rank: 18, rankClass: "B+" },

  { name: "1-60", type: "ratchet", rank: 1, rankClass: "S" },
  { name: "9-60", type: "ratchet", rank: 2, rankClass: "S" },
  { name: "3-60", type: "ratchet", rank: 3, rankClass: "A+" },
  { name: "5-60", type: "ratchet", rank: 4, rankClass: "A+" },
  { name: "7-60", type: "ratchet", rank: 5, rankClass: "A+" },
  { name: "4-60", type: "ratchet", rank: 6, rankClass: "A" },
  { name: "4-50", type: "ratchet", rank: 8, rankClass: "A" },
  { name: "2-60", type: "ratchet", rank: 12, rankClass: "A-" },
  { name: "5-70", type: "ratchet", rank: 15, rankClass: "B+" },

  { name: "Metal Needle", type: "lockChip", rank: 1, rankClass: "S" },
  { name: "Metal Coat", type: "lockChip", rank: 2, rankClass: "S" }
];

export const gamerImageParts = [
  { name: "Shark Scale", type: "blade", tier: "T0", rankClass: "S" },
  { name: "Silver Wolf", type: "blade", tier: "T0", rankClass: "S" },
  { name: "Wizard Rod", type: "blade", tier: "T0.5", rankClass: "A+" },
  { name: "Dran Buster", type: "blade", tier: "T1", rankClass: "A" },
  { name: "Phoenix Wing", type: "blade", tier: "T1", rankClass: "A" },
  { name: "Rage", type: "blade", tier: "T1", rankClass: "A" },
  { name: "1-60", type: "ratchet", tier: "T0.5", rankClass: "A+" },
  { name: "9-60", type: "ratchet", tier: "T0.5", rankClass: "A+" },
  { name: "3-60", type: "ratchet", tier: "T1", rankClass: "A" },
  { name: "7-60", type: "ratchet", tier: "T1", rankClass: "A" },
  { name: "U", type: "bit", tier: "T1.5", rankClass: "A-" },
  { name: "T", type: "bit", tier: "T1", rankClass: "A" },
  { name: "B", type: "bit", tier: "T1", rankClass: "A" },
  { name: "LR", type: "bit", tier: "T0", rankClass: "S" },
  { name: "R", type: "bit", tier: "T0.5", rankClass: "A+" },
  { name: "Rush", type: "bit", tier: "T0.5", rankClass: "A+" }
];

export const aliases = {
  "Keel Shark": "Shark Edge",
  SharkEdge: "Shark Edge",
  "Gill Shark": "Gill Shark",
  "Shark Scale": "Shark Scale",
  "Wand Wizard": "Wizard Rod",
  "Sword Dran": "Dran Sword",
  "Dagger Dran": "Dran Dagger",
  "Soar Phoenix": "Phoenix Wing",
  "Roar Tyranno": "Tyranno Beat",
  "Lance Knight": "Knight Lance",
  "Tusk Mammoth": "Mammoth Tusk",
  "Rock Golem": "Golem Rock",
  "Pearl Tiger": "Pearl Tiger",
  "Flame Cerberus": "Flame Cerberus",
  "Ring Aether": "Ring Aether",
  "Antler Stag": "Antler Stag"
};

export const assistBladeCodes = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
  F: "F",
  G: "G",
  L: "L",
  R: "R"
};

export const overBladeCodes = {
  F: "F",
  W: "W"
};

export const bitNames = {
  B: "Ball",
  DB: "Disc Ball",
  E: "Elevate",
  GF: "Gear Flat",
  HN: "High Needle",
  LF: "Low Flat",
  LR: "Low Rush",
  O: "Orb",
  R: "Rush",
  T: "Taper",
  U: "Unite",
  UN: "Under Needle",
  Y: "Yield"
};

export const sampleProducts = [
  {
    name: "Gill Shark 4-70O, Pearl Tiger 3-60U Dual Pack",
    price: 22.98,
    configs: ["Gill Shark 4-70O", "Pearl Tiger 3-60U"]
  },
  {
    name: "Keel Shark 3-60LF Booster",
    price: 12.99,
    configs: ["Keel Shark 3-60LF"]
  },
  {
    name: "Wand Wizard 5-70DB Starter",
    price: 20,
    configs: ["Wand Wizard 5-70DB"]
  },
  {
    name: "Rock Golem 1-60UN Booster",
    price: 16.99,
    configs: ["Rock Golem 1-60UN"]
  },
  {
    name: "Xtreme Battle Set",
    price: 70,
    configs: ["Dagger Dran 4-60R", "Tusk Mammoth 3-60T"]
  },
  {
    name: "Rage Ragna FE4-55Y CX Infinity Starter",
    price: 19.99,
    configs: ["Rage Ragna FE4-55Y"],
    cx: true
  },
  {
    name: "Antler Stag B 2-60HN CX Starter",
    price: 19.99,
    configs: ["Antler Stag B 2-60HN"],
    cx: true
  },
  {
    name: "Soar Phoenix 9-60GF Deluxe String Launcher Set",
    price: 34.68,
    configs: ["Soar Phoenix 9-60GF"]
  }
];
