/** Meta progression: daily goals, streaks, achievements, research, cosmetics, tags */

import type { IconName } from "@/lib/iconNames";

export type SessionTag =
  | "coding"
  | "study"
  | "deep_work"
  | "creative"
  | "other";

export const SESSION_TAGS: {
  id: SessionTag;
  label: string;
  icon: IconName;
}[] = [
  { id: "coding", label: "Coding", icon: "code" },
  { id: "study", label: "Study", icon: "study" },
  { id: "deep_work", label: "Deep work", icon: "target" },
  { id: "creative", label: "Creative", icon: "creative" },
  { id: "other", label: "Other", icon: "sparkles" },
];

export const DEFAULT_DAILY_GOAL_MINUTES = 50;
export const MIN_DAILY_GOAL = 10;
export const MAX_DAILY_GOAL = 480;

/**
 * Anti-spam lockout after consecutive Give Ups.
 * Short enough to not kill a study day; long enough to stop rage-retry spam.
 * 1st fail: no lock · 2nd: 2m · 3rd: 5m · 4th: 12m · 5+: 20m
 */
export const FAIL_LOCK_THRESHOLD = 2;

export function failLockoutMs(failStreak: number): number {
  if (failStreak < FAIL_LOCK_THRESHOLD) return 0;
  if (failStreak === 2) return 2 * 60 * 1000;
  if (failStreak === 3) return 5 * 60 * 1000;
  if (failStreak === 4) return 12 * 60 * 1000;
  return 20 * 60 * 1000;
}

export function getLockRemainingMs(lockUntil: number | null, now = Date.now()) {
  if (!lockUntil || lockUntil <= now) return 0;
  return lockUntil - now;
}

export function formatLockRemaining(ms: number) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export type ResearchId =
  | "efficient_harvest"
  | "resilient_core"
  | "calm_signal";

export interface ResearchDef {
  id: ResearchId;
  name: string;
  icon: IconName;
  description: string;
  costCrystals: number;
  costEnergy: number;
}

export const RESEARCH: Record<ResearchId, ResearchDef> = {
  efficient_harvest: {
    id: "efficient_harvest",
    name: "Efficient Harvest",
    icon: "harvest",
    description: "+8% crystals & energy from completed sessions.",
    costCrystals: 55,
    costEnergy: 30,
  },
  resilient_core: {
    id: "resilient_core",
    name: "Resilient Core",
    icon: "shield",
    description: "−15% resources lost when you give up.",
    costCrystals: 40,
    costEnergy: 55,
  },
  calm_signal: {
    id: "calm_signal",
    name: "Calm Signal",
    icon: "signal",
    description: "Ambient events arrive a bit more often with steadier rewards.",
    costCrystals: 35,
    costEnergy: 35,
  },
};

export type CoreSkin = "default" | "gold" | "rose" | "cyan";
export type SkySkin = "default" | "dusk" | "void";

export interface CosmeticDef<T extends string> {
  id: T;
  name: string;
  unlock: { type: "level" | "achievement" | "default"; value?: string | number };
}

export const CORE_SKINS: CosmeticDef<CoreSkin>[] = [
  { id: "default", name: "Azure Core", unlock: { type: "default" } },
  { id: "gold", name: "Solar Core", unlock: { type: "level", value: 3 } },
  { id: "rose", name: "Ember Core", unlock: { type: "achievement", value: "streak_3" } },
  { id: "cyan", name: "Ice Core", unlock: { type: "level", value: 5 } },
];

export const SKY_SKINS: CosmeticDef<SkySkin>[] = [
  { id: "default", name: "Midnight", unlock: { type: "default" } },
  { id: "dusk", name: "Dusk Bloom", unlock: { type: "level", value: 2 } },
  { id: "void", name: "Deep Void", unlock: { type: "achievement", value: "sessions_10" } },
];

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: IconName;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_session",
    name: "First Light",
    description: "Complete your first focus session.",
    icon: "sunrise",
  },
  {
    id: "sessions_10",
    name: "Decathlete",
    description: "Complete 10 sessions.",
    icon: "ten",
  },
  {
    id: "sessions_25",
    name: "Constellation",
    description: "Complete 25 sessions.",
    icon: "star",
  },
  {
    id: "focus_1h",
    name: "One Hour Orbit",
    description: "Accumulate 1 hour of focus.",
    icon: "timer",
  },
  {
    id: "focus_10h",
    name: "Deep Orbit",
    description: "Accumulate 10 hours of focus.",
    icon: "orbit",
  },
  {
    id: "streak_3",
    name: "Three Suns",
    description: "Reach a 3-day streak.",
    icon: "flame",
  },
  {
    id: "streak_7",
    name: "Week of Stars",
    description: "Reach a 7-day streak.",
    icon: "stars",
  },
  {
    id: "builder_1",
    name: "Foundation",
    description: "Place your first structure.",
    icon: "build",
  },
  {
    id: "builder_all",
    name: "Full Deck",
    description: "Own every building type at once.",
    icon: "building",
  },
  {
    id: "upgrade_3",
    name: "Overclock",
    description: "Raise any building to level 3.",
    icon: "upgrade",
  },
  {
    id: "clean_run",
    name: "Steady Hands",
    description: "Complete 5 sessions without giving up in between.",
    icon: "steady",
  },
  {
    id: "daily_goal",
    name: "Quota Met",
    description: "Hit your daily focus goal.",
    icon: "target",
  },
];

/** Local calendar date YYYY-MM-DD */
export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function yesterdayKey(d = new Date()) {
  const x = new Date(d);
  x.setDate(x.getDate() - 1);
  return todayKey(x);
}

/** Streak should feel worth protecting — scales return incentive. */
export function streakRewardMultiplier(currentStreak: number) {
  if (currentStreak >= 14) return 1.3;
  if (currentStreak >= 7) return 1.22;
  if (currentStreak >= 5) return 1.15;
  if (currentStreak >= 3) return 1.1;
  if (currentStreak >= 1) return 1.05;
  return 1;
}

/** Observatory level from total focused seconds */
export function observatoryLevel(totalFocusSeconds: number) {
  // ~30 min per level early, soft curve
  const minutes = totalFocusSeconds / 60;
  let level = 1;
  let need = 30;
  let acc = 0;
  while (acc + need <= minutes && level < 20) {
    acc += need;
    level += 1;
    need = Math.round(need * 1.35);
  }
  const into = minutes - acc;
  const progress = need > 0 ? Math.min(1, into / need) : 1;
  return { level, progress, nextMinutes: need, intoMinutes: into };
}

export function observatoryRewardMult(level: number) {
  return 1 + Math.max(0, level - 1) * 0.02;
}

export function breakSecondsForSession(sessionSeconds: number) {
  // ~20% of work, clamped 3–15 min (or 15s for micro tests)
  if (sessionSeconds <= 30) return 15;
  const raw = Math.round(sessionSeconds * 0.2);
  return Math.min(15 * 60, Math.max(3 * 60, raw));
}

export function isCosmeticUnlocked(
  unlock: CosmeticDef<string>["unlock"],
  level: number,
  achievements: string[]
) {
  if (unlock.type === "default") return true;
  if (unlock.type === "level") return level >= Number(unlock.value);
  if (unlock.type === "achievement")
    return achievements.includes(String(unlock.value));
  return false;
}

export type AchievementContext = {
  sessionsCompleted: number;
  totalFocusSeconds: number;
  currentStreak: number;
  placedTypes: string[];
  maxBuildingLevel: number;
  cleanRun: number; // consecutive completes without fail
  dailyGoalHit: boolean;
  buildingCount: number;
};

export function evaluateNewAchievements(
  unlocked: string[],
  ctx: AchievementContext
): string[] {
  const have = new Set(unlocked);
  const next: string[] = [];
  const tryUnlock = (id: string, cond: boolean) => {
    if (cond && !have.has(id)) next.push(id);
  };

  tryUnlock("first_session", ctx.sessionsCompleted >= 1);
  tryUnlock("sessions_10", ctx.sessionsCompleted >= 10);
  tryUnlock("sessions_25", ctx.sessionsCompleted >= 25);
  tryUnlock("focus_1h", ctx.totalFocusSeconds >= 3600);
  tryUnlock("focus_10h", ctx.totalFocusSeconds >= 36000);
  tryUnlock("streak_3", ctx.currentStreak >= 3);
  tryUnlock("streak_7", ctx.currentStreak >= 7);
  tryUnlock("builder_1", ctx.buildingCount >= 1);
  tryUnlock(
    "builder_all",
    ["energy_core", "data_tower", "botanical_lab", "shield_generator", "signal_dish"].every(
      (t) => ctx.placedTypes.includes(t)
    )
  );
  tryUnlock("upgrade_3", ctx.maxBuildingLevel >= 3);
  tryUnlock("clean_run", ctx.cleanRun >= 5);
  tryUnlock("daily_goal", ctx.dailyGoalHit);

  return next;
}
