import type { IconName } from "@/lib/iconNames";

export type BuildingType =
  | "energy_core"
  | "data_tower"
  | "botanical_lab"
  | "shield_generator"
  | "signal_dish";

export const MAX_BUILDING_LEVEL = 5;
export const GRID_SNAP = 1;
/** Outer walk/place limit (island surface) */
export const ISLAND_PLACE_RADIUS = 3.5;
/** Keep core + observatory free (matches NPC walk ban) */
export const CORE_EXCLUSION_RADIUS = 2.0;

/**
 * Economy targets (approx, no buildings):
 * - Start: place 1 cheap structure immediately, 2nd after a short session
 * - 25m focus ≈ 1 early upgrade or most of a mid building
 * - Fail hurts but rarely deletes a whole day of progress
 * - Streak + daily goal + comeback gifts pull you back tomorrow
 */
export const STARTING_CRYSTALS = 150;
export const STARTING_ENERGY = 150;

/** Flat bonus the first time you hit the daily focus goal that day */
export const DAILY_GOAL_BONUS = { crystals: 18, energy: 18 };
/** Gift when returning after missing 1+ calendar days */
export const COMEBACK_GIFT = { crystals: 20, energy: 20 };

export const MIN_FOCUS_MINUTES = 1;
export const MAX_FOCUS_MINUTES = 120;
export const DEFAULT_FOCUS_MINUTES = 25;

export const DURATION_PRESETS = [
  { label: "5m", minutes: 5 },
  { label: "15m", minutes: 15 },
  { label: "25m", minutes: 25 },
  { label: "45m", minutes: 45 },
  { label: "60m", minutes: 60 },
] as const;

export function rewardsForDuration(durationSeconds: number) {
  if (durationSeconds <= 10) {
    return {
      name: "Quick Focus",
      baseCrystals: 6,
      baseEnergy: 6,
    };
  }

  const minutes = durationSeconds / 60;
  // ~1 resource / minute, slight long-session bonus past 40m
  let base = Math.max(5, Math.round(minutes * 1.05));
  if (minutes >= 40) base = Math.round(base * 1.08);
  if (minutes >= 55) base = Math.round(base * 1.05);

  let name = "Focus Session";
  if (minutes >= 50) name = "Deep Focus Marathon";
  else if (minutes >= 20) name = "Deep Work Session";
  else if (minutes >= 10) name = "Focus Sprint";
  else name = "Micro Focus";

  return {
    name,
    baseCrystals: base,
    baseEnergy: base,
  };
}

export function clampFocusMinutes(minutes: number) {
  if (!Number.isFinite(minutes)) return DEFAULT_FOCUS_MINUTES;
  return Math.min(
    MAX_FOCUS_MINUTES,
    Math.max(MIN_FOCUS_MINUTES, Math.round(minutes))
  );
}

export interface BuildingDef {
  id: BuildingType;
  name: string;
  icon: IconName;
  costCrystals: number;
  costEnergy: number;
  crystalBonusPerLevel: number;
  energyBonusPerLevel: number;
  /** Subtracted from fail penalty (sum of level * value, capped later) */
  failMitigationPerLevel: number;
  /** Bonus multiplier on ambient event rewards */
  eventBonusPerLevel: number;
  description: string;
  buffLabel: string;
  accent: "amber" | "violet" | "emerald" | "sky" | "rose";
}

export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  energy_core: {
    id: "energy_core",
    name: "Energy Core",
    icon: "energy",
    costCrystals: 80,
    costEnergy: 0,
    crystalBonusPerLevel: 0,
    energyBonusPerLevel: 0.12,
    failMitigationPerLevel: 0,
    eventBonusPerLevel: 0,
    description: "Harvests residual focus into pure energy.",
    buffLabel: "+12% Energy per level / session",
    accent: "amber",
  },
  data_tower: {
    id: "data_tower",
    name: "Data Tower",
    icon: "tower",
    costCrystals: 0,
    costEnergy: 80,
    crystalBonusPerLevel: 0.12,
    energyBonusPerLevel: 0,
    failMitigationPerLevel: 0,
    eventBonusPerLevel: 0,
    description: "Crystallizes deep-work insights into data shards.",
    buffLabel: "+12% Crystals per level / session",
    accent: "violet",
  },
  botanical_lab: {
    id: "botanical_lab",
    name: "Botany Lab",
    icon: "leaf",
    costCrystals: 55,
    costEnergy: 30,
    crystalBonusPerLevel: 0.05,
    energyBonusPerLevel: 0.05,
    failMitigationPerLevel: 0,
    eventBonusPerLevel: 0,
    description: "Balances the island biosphere — a dual-resource greenhouse.",
    buffLabel: "+5% Crystals & Energy per level / session",
    accent: "emerald",
  },
  shield_generator: {
    id: "shield_generator",
    name: "Shield Gen",
    icon: "shield",
    costCrystals: 70,
    costEnergy: 45,
    crystalBonusPerLevel: 0,
    energyBonusPerLevel: 0,
    failMitigationPerLevel: 0.07,
    eventBonusPerLevel: 0,
    description: "Dampens corruption bleed when a session is abandoned.",
    buffLabel: "−7% fail penalty per level",
    accent: "sky",
  },
  signal_dish: {
    id: "signal_dish",
    name: "Signal Dish",
    icon: "signal",
    costCrystals: 45,
    costEnergy: 65,
    crystalBonusPerLevel: 0,
    energyBonusPerLevel: 0,
    failMitigationPerLevel: 0,
    eventBonusPerLevel: 0.18,
    description: "Tunes ambient events for richer micro-rewards.",
    buffLabel: "+18% event loot per level",
    accent: "rose",
  },
};

export function getBuildingCost(type: BuildingType) {
  const def = BUILDINGS[type];
  return { crystals: def.costCrystals, energy: def.costEnergy };
}

export function getUpgradeCost(type: BuildingType, currentLevel: number) {
  const base = getBuildingCost(type);
  // Gentle early, steeper late: L1→2 ≈ 0.85× place, L4→5 ≈ 2.05× place
  const mult = 0.45 + currentLevel * 0.4;
  return {
    crystals: Math.round(base.crystals * mult) || Math.round(35 * mult),
    energy: Math.round(base.energy * mult) || Math.round(35 * mult),
  };
}

export function computeMultipliers(
  buildings: { type: BuildingType; level: number }[]
) {
  let crystalBonus = 0;
  let energyBonus = 0;
  let failMitigation = 0;
  let eventBonus = 0;
  for (const b of buildings) {
    const def = BUILDINGS[b.type];
    crystalBonus += def.crystalBonusPerLevel * b.level;
    energyBonus += def.energyBonusPerLevel * b.level;
    failMitigation += def.failMitigationPerLevel * b.level;
    eventBonus += def.eventBonusPerLevel * b.level;
  }
  return {
    crystals: 1 + crystalBonus,
    energy: 1 + energyBonus,
    failMitigation: Math.min(0.55, failMitigation),
    eventBonus: Math.min(1.4, eventBonus),
  };
}

export function computeQuestRewards(
  baseCrystals: number,
  baseEnergy: number,
  buildings: { type: BuildingType; level: number }[],
  globalMult = 1
) {
  const m = computeMultipliers(buildings);
  return {
    crystals: Math.round(baseCrystals * m.crystals * globalMult),
    energy: Math.round(baseEnergy * m.energy * globalMult),
    multipliers: m,
    globalMult,
  };
}

export function computeFailPenalty(input: {
  crystals: number;
  energy: number;
  baseCrystals: number;
  baseEnergy: number;
  totalDuration: number;
  timeRemaining: number;
  failStreak: number;
  /** 0–0.7 from shields + research */
  mitigation?: number;
}) {
  const {
    crystals,
    energy,
    baseCrystals,
    baseEnergy,
    totalDuration,
    timeRemaining,
    failStreak,
    mitigation = 0,
  } = input;

  const duration = Math.max(1, totalDuration);
  const remainingRatio = Math.min(1, Math.max(0, timeRemaining / duration));
  // Softer early-quit curve; late fails (almost done) still sting a bit less
  const earlyMultiplier = 1.0 + remainingRatio * 0.35;
  const streakMultiplier = Math.min(1.75, 1 + failStreak * 0.15);
  const mit = Math.min(0.65, Math.max(0, mitigation));

  const mult = earlyMultiplier * streakMultiplier * (1 - mit);

  // Mostly tax session value, not your whole bank
  const rawCrystals =
    Math.max(5, Math.round(crystals * 0.06) + Math.round(baseCrystals * 0.55)) *
    mult;
  const rawEnergy =
    Math.max(5, Math.round(energy * 0.06) + Math.round(baseEnergy * 0.55)) *
    mult;

  return {
    crystals: Math.min(crystals, Math.round(rawCrystals)),
    energy: Math.min(energy, Math.round(rawEnergy)),
    earlyMultiplier,
    streakMultiplier,
    remainingRatio,
    mitigation: mit,
  };
}

export function positionKey(x: number, z: number) {
  return `${x},${z}`;
}
