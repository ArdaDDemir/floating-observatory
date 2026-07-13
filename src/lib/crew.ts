import type { BuildingType } from "@/lib/gameConfig";
import type { IconName } from "@/lib/iconNames";

export type CrewRole =
  | "worker"
  | "gardener"
  | "scout"
  | "engineer"
  | "caretaker"
  | "archivist"
  | "courier";

export interface CrewMember {
  id: string;
  role: CrewRole;
  name: string;
  /** null = free roam */
  assignedBuildingId: string | null;
}

export interface CrewRoleDef {
  id: CrewRole;
  name: string;
  icon: IconName;
  description: string;
  /** Preferred building types for assignment hints */
  prefers: BuildingType[];
  hue: string;
  /** 3D body style on the island */
  body: "bot" | "scout" | "sprout" | "orb";
}

export const CREW_ROLES: Record<CrewRole, CrewRoleDef> = {
  worker: {
    id: "worker",
    name: "Worker",
    icon: "build",
    description: "Assigned structures cost a bit less to upgrade.",
    prefers: ["energy_core", "data_tower", "shield_generator", "signal_dish"],
    hue: "#94a3b8",
    body: "bot",
  },
  gardener: {
    id: "gardener",
    name: "Gardener",
    icon: "leaf",
    description: "Boosts Botany Lab crystal & energy share.",
    prefers: ["botanical_lab"],
    hue: "#4ade80",
    body: "sprout",
  },
  scout: {
    id: "scout",
    name: "Scout",
    icon: "signal",
    description: "Richer ambient event loot while focusing.",
    prefers: ["signal_dish", "data_tower"],
    hue: "#38bdf8",
    body: "scout",
  },
  engineer: {
    id: "engineer",
    name: "Engineer",
    icon: "energy",
    description: "Pushes Energy Core session energy yield.",
    prefers: ["energy_core", "shield_generator"],
    hue: "#fbbf24",
    body: "bot",
  },
  caretaker: {
    id: "caretaker",
    name: "Caretaker",
    icon: "shield",
    description: "Softens fail penalty a little more.",
    prefers: ["shield_generator"],
    hue: "#a78bfa",
    body: "orb",
  },
  archivist: {
    id: "archivist",
    name: "Archivist",
    icon: "tower",
    description: "Data Towers mint extra crystals per session.",
    prefers: ["data_tower"],
    hue: "#c084fc",
    body: "orb",
  },
  courier: {
    id: "courier",
    name: "Courier",
    icon: "sparkles",
    description: "Tiny dual bonus on any assigned post.",
    prefers: [
      "energy_core",
      "data_tower",
      "botanical_lab",
      "shield_generator",
      "signal_dish",
    ],
    hue: "#f472b6",
    body: "scout",
  },
};

const NAME_POOL = [
  "Iri",
  "Nox",
  "Peb",
  "Luma",
  "Kite",
  "Moss",
  "Vex",
  "Orr",
  "Nyx",
  "Sol",
  "Pip",
  "Rae",
  "Zed",
  "Ash",
  "Quin",
  "Bo",
  "Elm",
  "Juno",
  "Kip",
  "Mira",
  "Tavi",
  "Wisp",
  "Yara",
  "Cinder",
  "Drift",
  "Halo",
  "Iota",
  "Jade",
  "Lark",
  "Nova",
];

/** Role unlock order as roster grows */
const ROLE_ORDER: CrewRole[] = [
  "worker",
  "gardener",
  "scout",
  "engineer",
  "caretaker",
  "archivist",
  "courier",
  "worker",
  "scout",
  "gardener",
  "engineer",
  "courier",
];

/**
 * Crew slots by observatory level.
 * L1 → 2 · each level +1 · max 12 (island stays readable).
 */
export function crewSlotsForLevel(obsLevel: number) {
  return Math.min(12, Math.max(2, 1 + Math.max(1, obsLevel)));
}

export function makeCrewMember(index: number, role?: CrewRole): CrewMember {
  const r = role ?? ROLE_ORDER[index % ROLE_ORDER.length]!;
  const nameBase = NAME_POOL[index % NAME_POOL.length]!;
  // Disambiguate when pool wraps
  const name =
    index < NAME_POOL.length ? nameBase : `${nameBase}-${Math.floor(index / NAME_POOL.length) + 1}`;
  return {
    id: `crew-${index}-${r}-${nameBase.toLowerCase()}`,
    role: r,
    name,
    assignedBuildingId: null,
  };
}

/**
 * Coerce persisted / buggy crew values to a flat CrewMember[].
 * (Earlier builds accidentally nested { crew, newcomers } into state.crew.)
 */
export function normalizeCrewList(existing: unknown): CrewMember[] {
  if (Array.isArray(existing)) {
    return existing.filter(
      (m): m is CrewMember =>
        !!m &&
        typeof m === "object" &&
        typeof (m as CrewMember).id === "string" &&
        typeof (m as CrewMember).role === "string"
    );
  }
  if (
    existing &&
    typeof existing === "object" &&
    Array.isArray((existing as { crew?: unknown }).crew)
  ) {
    return normalizeCrewList((existing as { crew: unknown }).crew);
  }
  return [];
}

/**
 * Expand roster when slots increase; never shrinks existing members.
 * Returns { crew, newcomers } so UI can toast new arrivals.
 */
export function ensureCrewRoster(
  existing: unknown,
  slots: number
): { crew: CrewMember[]; newcomers: CrewMember[] } {
  const list = normalizeCrewList(existing);
  const safeSlots = Math.max(0, Math.floor(slots) || 0);
  if (list.length >= safeSlots) return { crew: list, newcomers: [] };
  const next = [...list];
  const newcomers: CrewMember[] = [];
  let i = list.length;
  while (next.length < safeSlots) {
    const m = makeCrewMember(i);
    next.push(m);
    newcomers.push(m);
    i += 1;
  }
  return { crew: next, newcomers };
}

export interface CrewBuffs {
  upgradeDiscount: number; // 0–0.25
  botanicalBonus: number;
  eventLootBonus: number;
  energyBonus: number;
  crystalBonus: number;
  failMitigation: number;
}

export function computeCrewBuffs(
  crew: unknown,
  buildings: { id: string; type: BuildingType }[]
): CrewBuffs {
  const list = normalizeCrewList(crew);
  const byId = new Map(buildings.map((b) => [b.id, b]));
  let upgradeDiscount = 0;
  let botanicalBonus = 0;
  let eventLootBonus = 0;
  let energyBonus = 0;
  let crystalBonus = 0;
  let failMitigation = 0;

  for (const c of list) {
    if (!c.assignedBuildingId) continue;
    const b = byId.get(c.assignedBuildingId);
    if (!b) continue;

    switch (c.role) {
      case "worker":
        upgradeDiscount += 0.04;
        break;
      case "gardener":
        if (b.type === "botanical_lab") botanicalBonus += 0.04;
        break;
      case "scout":
        eventLootBonus += 0.12;
        break;
      case "engineer":
        if (b.type === "energy_core" || b.type === "shield_generator") {
          energyBonus += 0.06;
        }
        break;
      case "caretaker":
        if (b.type === "shield_generator") failMitigation += 0.04;
        break;
      case "archivist":
        if (b.type === "data_tower") crystalBonus += 0.06;
        break;
      case "courier":
        botanicalBonus += 0.02;
        energyBonus += 0.02;
        crystalBonus += 0.02;
        break;
    }
  }

  return {
    upgradeDiscount: Math.min(0.25, upgradeDiscount),
    botanicalBonus: Math.min(0.25, botanicalBonus),
    eventLootBonus: Math.min(0.6, eventLootBonus),
    energyBonus: Math.min(0.35, energyBonus),
    crystalBonus: Math.min(0.35, crystalBonus),
    failMitigation: Math.min(0.2, failMitigation),
  };
}

export function refundForDestroy(type: BuildingType, level: number) {
  const mult = 0.5 * (0.85 + level * 0.15);
  return mult;
}

export function preferredPostsHint(role: CrewRole): string {
  const prefs = CREW_ROLES[role].prefers;
  return prefs.join(", ");
}
