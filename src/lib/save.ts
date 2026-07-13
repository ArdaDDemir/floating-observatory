/**
 * Sealed save format with integrity hash.
 * Client-side only — deters casual JSON edits; not military-grade anti-cheat.
 */

export const SAVE_VERSION = 3;
export const SAVE_STORAGE_KEY = "observatory-save-v3";
/** Previous unsealed persist key — migrated once into v3 */
export const LEGACY_SAVE_STORAGE_KEY = "observatory-save-v2";

/** Pepper mixed into the hash (obfuscation, not a real secret once shipped). */
const PEPPER =
  "modest-fermi::observatory::v3::meteor-watch::do-not-edit-json";

export type SaveSummary = {
  totalFocusSeconds: number;
  totalFocusMinutes: number;
  totalFocusHours: number;
  currentStreak: number;
  longestStreak: number;
  sessionsCompleted: number;
  sessionsFailed: number;
  dailyFocusSeconds: number;
  dailyGoalMinutes: number;
  buildingCount: number;
  crewCount: number;
  achievementCount: number;
  exportedAt: string;
};

/** Everything that must survive reload / export */
export type SavePayload = {
  version: number;
  resources: { crystals: number; energy: number };
  placedBuildings: unknown[];
  crew: unknown[];
  sessionLog: unknown[];
  stats: Record<string, unknown>;
  unlockedAchievements: string[];
  research: Record<string, unknown>;
  coreSkin: string;
  skySkin: string;
  prefs: Record<string, unknown>;
  preferredFocusMinutes: number;
  preferredTag: string;
  lockUntil: number | null;
  hasSeenOnboarding: boolean;
  islandState: string;
  lastReward: unknown;
  lastPenalty: unknown;
};

export type SealedSave = SavePayload & {
  summary: SaveSummary;
  integrity: string;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

/** Sync FNV-1a 64-bit-ish hex hash (no async crypto needed for localStorage). */
export function integrityHash(canonicalBody: string): string {
  const input = `${PEPPER}\n${canonicalBody}\n${PEPPER.split("").reverse().join("")}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5 ^ 0xdeadbeef;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c + (i % 17);
    h2 = Math.imul(h2, 0x01000193);
  }
  // mix
  h1 ^= h2 >>> 13;
  h2 ^= h1 << 7;
  const a = (h1 >>> 0).toString(16).padStart(8, "0");
  const b = (h2 >>> 0).toString(16).padStart(8, "0");
  // second pass for length
  let h3 = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h3 ^= input.charCodeAt(i);
    h3 = Math.imul(h3, 16777619);
  }
  const c = (h3 >>> 0).toString(16).padStart(8, "0");
  return `${a}${b}${c}`;
}

export function buildSummary(
  payload: Pick<
    SavePayload,
    "stats" | "placedBuildings" | "crew" | "unlockedAchievements"
  >
): SaveSummary {
  const stats = payload.stats as {
    totalFocusSeconds?: number;
    currentStreak?: number;
    longestStreak?: number;
    sessionsCompleted?: number;
    sessionsFailed?: number;
    dailyFocusSeconds?: number;
    dailyGoalMinutes?: number;
  };
  const sec = Number(stats.totalFocusSeconds ?? 0);
  return {
    totalFocusSeconds: sec,
    totalFocusMinutes: Math.floor(sec / 60),
    totalFocusHours: Math.round((sec / 3600) * 10) / 10,
    currentStreak: Number(stats.currentStreak ?? 0),
    longestStreak: Number(stats.longestStreak ?? 0),
    sessionsCompleted: Number(stats.sessionsCompleted ?? 0),
    sessionsFailed: Number(stats.sessionsFailed ?? 0),
    dailyFocusSeconds: Number(stats.dailyFocusSeconds ?? 0),
    dailyGoalMinutes: Number(stats.dailyGoalMinutes ?? 0),
    buildingCount: Array.isArray(payload.placedBuildings)
      ? payload.placedBuildings.length
      : 0,
    crewCount: Array.isArray(payload.crew) ? payload.crew.length : 0,
    achievementCount: Array.isArray(payload.unlockedAchievements)
      ? payload.unlockedAchievements.length
      : 0,
    exportedAt: new Date().toISOString(),
  };
}

/** Canonical body used for hashing (no summary/integrity). */
export function canonicalSaveBody(payload: SavePayload): string {
  const {
    version,
    resources,
    placedBuildings,
    crew,
    sessionLog,
    stats,
    unlockedAchievements,
    research,
    coreSkin,
    skySkin,
    prefs,
    preferredFocusMinutes,
    preferredTag,
    lockUntil,
    hasSeenOnboarding,
    islandState,
    lastReward,
    lastPenalty,
  } = payload;

  return stableStringify({
    version,
    resources,
    placedBuildings,
    crew,
    sessionLog,
    stats,
    unlockedAchievements,
    research,
    coreSkin,
    skySkin,
    prefs,
    preferredFocusMinutes,
    preferredTag,
    lockUntil,
    hasSeenOnboarding,
    islandState,
    lastReward,
    lastPenalty,
  });
}

export function sealSave(payload: SavePayload): SealedSave {
  const body = canonicalSaveBody(payload);
  const integrity = integrityHash(body);
  const summary = buildSummary(payload);
  return {
    ...payload,
    summary,
    integrity,
  };
}

export type OpenSaveResult =
  | { ok: true; payload: SavePayload; summary: SaveSummary }
  | { ok: false; reason: string; cheated?: boolean };

export function openSave(data: unknown): OpenSaveResult {
  if (!data || typeof data !== "object") {
    return { ok: false, reason: "Invalid save file" };
  }
  const raw = data as Record<string, unknown>;

  // Accept sealed v3 or legacy v2 (no hash → soft import without cheat flag)
  const hasIntegrity = typeof raw.integrity === "string";

  const payload: SavePayload = {
    version: Number(raw.version ?? 2),
    resources: (raw.resources as SavePayload["resources"]) ?? {
      crystals: 0,
      energy: 0,
    },
    placedBuildings: Array.isArray(raw.placedBuildings)
      ? raw.placedBuildings
      : [],
    crew: Array.isArray(raw.crew) ? raw.crew : [],
    sessionLog: Array.isArray(raw.sessionLog) ? raw.sessionLog : [],
    stats: (raw.stats as Record<string, unknown>) ?? {},
    unlockedAchievements: Array.isArray(raw.unlockedAchievements)
      ? (raw.unlockedAchievements as string[])
      : [],
    research: (raw.research as Record<string, unknown>) ?? {},
    coreSkin: String(raw.coreSkin ?? "default"),
    skySkin: String(raw.skySkin ?? "default"),
    prefs: (raw.prefs as Record<string, unknown>) ?? {},
    preferredFocusMinutes: Number(raw.preferredFocusMinutes ?? 25),
    preferredTag: String(raw.preferredTag ?? "deep_work"),
    lockUntil:
      typeof raw.lockUntil === "number" || raw.lockUntil === null
        ? (raw.lockUntil as number | null)
        : null,
    hasSeenOnboarding: Boolean(raw.hasSeenOnboarding),
    islandState: String(raw.islandState ?? "healthy"),
    lastReward: raw.lastReward ?? null,
    lastPenalty: raw.lastPenalty ?? null,
  };

  if (hasIntegrity) {
    const expected = integrityHash(canonicalSaveBody(payload));
    if (expected !== raw.integrity) {
      return {
        ok: false,
        reason: "Save integrity check failed — data was tampered with.",
        cheated: true,
      };
    }
  }

  const summary =
    raw.summary && typeof raw.summary === "object"
      ? (raw.summary as SaveSummary)
      : buildSummary(payload);

  return { ok: true, payload, summary };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file: File): Promise<unknown> {
  const text = await file.text();
  return JSON.parse(text);
}

function payloadFromPartialState(
  s: Record<string, unknown>
): SavePayload {
  return {
    version: SAVE_VERSION,
    resources: (s.resources as SavePayload["resources"]) ?? {
      crystals: 0,
      energy: 0,
    },
    placedBuildings: (s.placedBuildings as unknown[]) ?? [],
    crew: (s.crew as unknown[]) ?? [],
    sessionLog: (s.sessionLog as unknown[]) ?? [],
    stats: (s.stats as Record<string, unknown>) ?? {},
    unlockedAchievements: (s.unlockedAchievements as string[]) ?? [],
    research: (s.research as Record<string, unknown>) ?? {},
    coreSkin: String(s.coreSkin ?? "default"),
    skySkin: String(s.skySkin ?? "default"),
    prefs: (s.prefs as Record<string, unknown>) ?? {},
    preferredFocusMinutes: Number(s.preferredFocusMinutes ?? 25),
    preferredTag: String(s.preferredTag ?? "deep_work"),
    lockUntil: (s.lockUntil as number | null) ?? null,
    hasSeenOnboarding: Boolean(s.hasSeenOnboarding),
    islandState: String(s.islandState ?? "healthy"),
    lastReward: s.lastReward ?? null,
    lastPenalty: s.lastPenalty ?? null,
  };
}

/**
 * One-shot: lift unsealed v2 zustand blob into sealed v3 format.
 * Returns a zustand-compatible JSON string, or null if nothing to migrate.
 */
export function migrateLegacySaveIfPresent(): string | null {
  if (typeof localStorage === "undefined") return null;
  // Already on v3?
  if (localStorage.getItem(SAVE_STORAGE_KEY)) return null;
  const legacy = localStorage.getItem(LEGACY_SAVE_STORAGE_KEY);
  if (!legacy) return null;

  try {
    const parsed = JSON.parse(legacy) as {
      state?: Record<string, unknown>;
      version?: number;
    };
    if (!parsed.state) return null;

    const payload = payloadFromPartialState(parsed.state);
    const sealed = sealSave(payload);
    const next = {
      state: {
        ...parsed.state,
        integrity: sealed.integrity,
        summary: sealed.summary,
      },
      version: parsed.version ?? 0,
    };
    const json = JSON.stringify(next);
    localStorage.setItem(SAVE_STORAGE_KEY, json);
    // Keep legacy as backup one session; mark so we don't re-process endlessly
    try {
      localStorage.setItem(
        `${LEGACY_SAVE_STORAGE_KEY}-migrated`,
        new Date().toISOString()
      );
      localStorage.removeItem(LEGACY_SAVE_STORAGE_KEY);
    } catch {
      /* ignore quota */
    }
    return json;
  } catch {
    return null;
  }
}

/** Zustand persist storage that seals / verifies the partialized state. */
export function createSealedLocalStorage(): {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
} {
  return {
    getItem(name) {
      if (typeof localStorage === "undefined") return null;

      let str = localStorage.getItem(name);
      // First load after upgrade: pull progress from unsealed v2
      if (!str && name === SAVE_STORAGE_KEY) {
        str = migrateLegacySaveIfPresent();
      }
      if (!str) return null;
      try {
        const parsed = JSON.parse(str) as {
          state?: Record<string, unknown>;
          version?: number;
        };
        if (!parsed.state) return str;

        // If integrity present, verify
        if (typeof parsed.state.integrity === "string") {
          const rest = { ...parsed.state };
          delete rest.integrity;
          delete rest.summary;
          const forHash = payloadFromPartialState(rest);
          const expected = integrityHash(canonicalSaveBody(forHash));
          if (expected !== parsed.state.integrity) {
            // Keep progress data but flag cheaterStrike for punishment on rehydrate
            return JSON.stringify({
              state: {
                ...parsed.state,
                cheaterStrike: true,
              },
              version: parsed.version,
            });
          }
        }
        return str;
      } catch {
        return str;
      }
    },
    setItem(name, value) {
      if (typeof localStorage === "undefined") return;
      try {
        const parsed = JSON.parse(value) as {
          state: Record<string, unknown>;
          version?: number;
        };
        const s = parsed.state;
        const payload = payloadFromPartialState(s);
        const sealed = sealSave(payload);
        // Store gameplay fields + integrity + summary (not full duplicate of sealed spread mess)
        const nextState = {
          ...s,
          integrity: sealed.integrity,
          summary: sealed.summary,
        };
        delete (nextState as { __integrityFailed?: boolean }).__integrityFailed;
        localStorage.setItem(
          name,
          JSON.stringify({ state: nextState, version: parsed.version })
        );
      } catch {
        try {
          localStorage.setItem(name, value);
        } catch {
          /* SSR / private mode */
        }
      }
    },
    removeItem(name) {
      if (typeof localStorage === "undefined") return;
      try {
        localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
    },
  };
}
