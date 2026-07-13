/**
 * Clash-style building visual tiers.
 * Levels 1–2 → tier 1 (basic)
 * Levels 3–4 → tier 2 (reinforced)
 * Level 5    → tier 3 (legendary)
 */
export type BuildingTier = 1 | 2 | 3;

export function buildingTier(level: number): BuildingTier {
  if (level >= 5) return 3;
  if (level >= 3) return 2;
  return 1;
}

export const TIER_ACCENT = {
  1: "#94a3b8", // steel
  2: "#38bdf8", // sky
  3: "#fbbf24", // gold
} as const;

export const TIER_SCALE = {
  1: 1,
  2: 1.12,
  3: 1.22,
} as const;
