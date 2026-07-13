import type { BuildingType } from "@/lib/gameConfig";
import type { IconName } from "@/lib/iconNames";

/**
 * Ambient focus events — inspired by gamification “random rewards” (mystery drops)
 * and Forest-style ambient feedback: surprise without demanding attention.
 *
 * Design rules:
 * - Never require a click or decision mid-session
 * - Auto-dismiss toasts only (no modals)
 * - Small rewards or pure flavor
 * - Cooldown + per-session cap so it stays rare
 */

export type FocusEventId =
  | "meteor_shower"
  | "solar_flare"
  | "stardust"
  | "nebula_whisper"
  | "aurora_band"
  | "core_hum"
  | "deep_current"
  | "data_cascade"
  | "botany_bloom"
  | "energy_echo"
  | "halfway_signal"
  | "final_stretch";

export type FocusEventKind = "reward" | "flavor" | "milestone";

export interface FocusEventDef {
  id: FocusEventId;
  title: string;
  body: string;
  icon: IconName;
  kind: FocusEventKind;
  /** Relative pick weight for random rolls */
  weight: number;
  /** Session must be at least this long to appear randomly */
  minSessionSeconds?: number;
  requiresBuilding?: BuildingType;
  reward?: { crystals?: number; energy?: number };
}

export interface FiredFocusEvent {
  instanceId: string;
  defId: FocusEventId;
  title: string;
  body: string;
  icon: IconName;
  kind: FocusEventKind;
  crystals: number;
  energy: number;
  createdAt: number;
}

export const FOCUS_EVENTS: FocusEventDef[] = [
  {
    id: "meteor_shower",
    title: "Meteor Shower",
    body: "Crystal dust settles on the island rim.",
    icon: "meteor",
    kind: "reward",
    weight: 14,
    reward: { crystals: 4 },
  },
  {
    id: "solar_flare",
    title: "Solar Flare",
    body: "The core drinks a pulse of ambient energy.",
    icon: "sun",
    kind: "reward",
    weight: 14,
    reward: { energy: 4 },
  },
  {
    id: "stardust",
    title: "Stardust Drift",
    body: "A thin trail of particles floats by.",
    icon: "sparkles",
    kind: "reward",
    weight: 18,
    reward: { crystals: 2, energy: 2 },
  },
  {
    id: "nebula_whisper",
    title: "Nebula Whisper",
    body: "Soft light pools under the observatory.",
    icon: "nebula",
    kind: "reward",
    weight: 10,
    minSessionSeconds: 5 * 60,
    reward: { crystals: 3, energy: 3 },
  },
  {
    id: "aurora_band",
    title: "Aurora Band",
    body: "A quiet ribbon of color arcs overhead.",
    icon: "aurora",
    kind: "reward",
    weight: 8,
    minSessionSeconds: 10 * 60,
    reward: { crystals: 5, energy: 3 },
  },
  {
    id: "core_hum",
    title: "Core Resonance",
    body: "The octahedron hums — still on track.",
    icon: "core",
    kind: "flavor",
    weight: 16,
  },
  {
    id: "deep_current",
    title: "Deep Current",
    body: "Focus holds. The island breathes with you.",
    icon: "wave",
    kind: "flavor",
    weight: 14,
  },
  {
    id: "energy_echo",
    title: "Energy Echo",
    body: "Your cores answer with a warm pulse.",
    icon: "energy",
    kind: "reward",
    weight: 10,
    requiresBuilding: "energy_core",
    reward: { energy: 4 },
  },
  {
    id: "data_cascade",
    title: "Data Cascade",
    body: "Towers crystallize a stray insight.",
    icon: "tower",
    kind: "reward",
    weight: 10,
    requiresBuilding: "data_tower",
    reward: { crystals: 4 },
  },
  {
    id: "botany_bloom",
    title: "Greenhouse Bloom",
    body: "Labs release a soft green glow.",
    icon: "leaf",
    kind: "reward",
    weight: 10,
    requiresBuilding: "botanical_lab",
    reward: { crystals: 2, energy: 2 },
  },
];

/** One-shot milestones (not in random pool) */
export const MILESTONE_EVENTS: Record<
  "halfway_signal" | "final_stretch",
  FocusEventDef
> = {
  halfway_signal: {
    id: "halfway_signal",
    title: "Halfway Signal",
    body: "You're past the midpoint. Steady as she goes.",
    icon: "signal",
    kind: "milestone",
    weight: 0,
    reward: { crystals: 2, energy: 2 },
  },
  final_stretch: {
    id: "final_stretch",
    title: "Final Stretch",
    body: "Less than 10% left. Bring it home.",
    icon: "flag",
    kind: "milestone",
    weight: 0,
    reward: { crystals: 1, energy: 1 },
  },
};

export interface SessionEventRuntime {
  /** Epoch-ms-ish counter: seconds elapsed since session start (we use remaining) */
  eventsThisSession: number;
  lastEventSecond: number | null;
  /** Cooldown remaining in seconds before next random roll */
  cooldownLeft: number;
  firedHalfway: boolean;
  firedFinalStretch: boolean;
  /** Avoid repeating the same random event id back-to-back */
  lastRandomId: FocusEventId | null;
}

export function createSessionEventRuntime(
  totalDuration = 25 * 60
): SessionEventRuntime {
  // Short sessions: first event sooner so ambient feedback is still felt
  const short = totalDuration < 3 * 60;
  const cooldownLeft = short
    ? 12 + Math.floor(Math.random() * 10)
    : 45 + Math.floor(Math.random() * 25);

  return {
    eventsThisSession: 0,
    lastEventSecond: null,
    cooldownLeft,
    firedHalfway: false,
    firedFinalStretch: false,
    lastRandomId: null,
  };
}

export function maxEventsForSession(totalDuration: number) {
  // ~1 event / 8 min, soft cap
  const byLength = Math.floor(totalDuration / (8 * 60));
  return Math.min(6, Math.max(1, byLength + 1));
}

function pickWeighted(
  pool: FocusEventDef[],
  excludeId: FocusEventId | null
): FocusEventDef | null {
  const filtered = pool.filter((e) => e.id !== excludeId);
  const list = filtered.length ? filtered : pool;
  const total = list.reduce((s, e) => s + e.weight, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const e of list) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return list[list.length - 1] ?? null;
}

function toFired(def: FocusEventDef): FiredFocusEvent {
  return {
    instanceId: `${def.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    defId: def.id,
    title: def.title,
    body: def.body,
    icon: def.icon,
    kind: def.kind,
    crystals: def.reward?.crystals ?? 0,
    energy: def.reward?.energy ?? 0,
    createdAt: Date.now(),
  };
}

export interface EventTickInput {
  totalDuration: number;
  timeRemaining: number;
  runtime: SessionEventRuntime;
  buildingTypes: BuildingType[];
  /** calm_signal research */
  calmSignal?: boolean;
  /** Multiplier on crystal/energy from signal dishes */
  eventLootMult?: number;
}

export interface EventTickResult {
  runtime: SessionEventRuntime;
  events: FiredFocusEvent[];
}

/**
 * Called once per second while session is running (not paused).
 * Returns 0–2 events (milestone + maybe random).
 */
export function tickFocusEvents(input: EventTickInput): EventTickResult {
  const { totalDuration, timeRemaining, buildingTypes } = input;
  const runtime: SessionEventRuntime = { ...input.runtime };
  const fired: FiredFocusEvent[] = [];

  // Ultra-short tests (<15s): skip ambient spam
  if (totalDuration < 15) {
    return { runtime, events: fired };
  }

  const elapsed = totalDuration - timeRemaining;
  const progress =
    totalDuration > 0 ? elapsed / totalDuration : 0;

  // —— Milestones (quiet, once each) ——
  if (!runtime.firedHalfway && progress >= 0.5 && totalDuration >= 5 * 60) {
    runtime.firedHalfway = true;
    runtime.eventsThisSession += 1;
    fired.push(toFired(MILESTONE_EVENTS.halfway_signal));
  }

  if (
    !runtime.firedFinalStretch &&
    progress >= 0.9 &&
    totalDuration >= 10 * 60
  ) {
    runtime.firedFinalStretch = true;
    runtime.eventsThisSession += 1;
    fired.push(toFired(MILESTONE_EVENTS.final_stretch));
  }

  // —— Random ambient ——
  if (runtime.cooldownLeft > 0) {
    runtime.cooldownLeft -= 1;
    return { runtime, events: fired };
  }

  const cap =
    maxEventsForSession(totalDuration) + (input.calmSignal ? 1 : 0);
  if (runtime.eventsThisSession >= cap) {
    return { runtime, events: fired };
  }

  // ~3.5%/s once eligible (short sessions a bit more frequent so they still fire)
  const chance =
    (totalDuration < 3 * 60 ? 0.08 : 0.035) * (input.calmSignal ? 1.35 : 1);
  if (Math.random() > chance) {
    return { runtime, events: fired };
  }

  const pool = FOCUS_EVENTS.filter((e) => {
    if (e.minSessionSeconds && totalDuration < e.minSessionSeconds) {
      return false;
    }
    if (e.requiresBuilding && !buildingTypes.includes(e.requiresBuilding)) {
      return false;
    }
    return true;
  });

  const def = pickWeighted(pool, runtime.lastRandomId);
  if (!def) return { runtime, events: fired };

  runtime.lastRandomId = def.id;
  runtime.eventsThisSession += 1;
  runtime.lastEventSecond = elapsed;
  // Next random eligibility window
  let cd =
    totalDuration < 3 * 60
      ? 18 + Math.floor(Math.random() * 12)
      : 50 + Math.floor(Math.random() * 40);
  if (input.calmSignal) cd = Math.round(cd * 0.75);
  runtime.cooldownLeft = cd;

  const loot = input.eventLootMult ?? 1;
  const base = toFired(def);
  if (loot !== 1 && (base.crystals || base.energy)) {
    base.crystals = Math.round(base.crystals * loot);
    base.energy = Math.round(base.energy * loot);
  }
  fired.push(base);

  return { runtime, events: fired };
}

/** Toast stays visible this long (ms) — short so it doesn't steal focus */
export const EVENT_TOAST_MS = 4200;
export const MAX_VISIBLE_TOASTS = 3;
