import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  STARTING_CRYSTALS,
  STARTING_ENERGY,
  MAX_BUILDING_LEVEL,
  DEFAULT_FOCUS_MINUTES,
  CORE_EXCLUSION_RADIUS,
  ISLAND_PLACE_RADIUS,
  DAILY_GOAL_BONUS,
  COMEBACK_GIFT,
  getBuildingCost,
  getUpgradeCost,
  computeQuestRewards,
  computeFailPenalty,
  computeMultipliers,
  rewardsForDuration,
  clampFocusMinutes,
  positionKey,
  type BuildingType,
} from "@/lib/gameConfig";
import {
  createSessionEventRuntime,
  tickFocusEvents,
  MAX_VISIBLE_TOASTS,
  type FiredFocusEvent,
  type SessionEventRuntime,
} from "@/lib/events";
import {
  DEFAULT_DAILY_GOAL_MINUTES,
  MIN_DAILY_GOAL,
  MAX_DAILY_GOAL,
  todayKey,
  yesterdayKey,
  streakRewardMultiplier,
  observatoryLevel,
  observatoryRewardMult,
  breakSecondsForSession,
  evaluateNewAchievements,
  ACHIEVEMENTS,
  failLockoutMs,
  getLockRemainingMs,
  type SessionTag,
  type ResearchId,
  type CoreSkin,
  type SkySkin,
  RESEARCH,
} from "@/lib/meta";
import type { IconName } from "@/lib/iconNames";
import {
  playCompleteChime,
  playFailThud,
  playEventTick,
  playEventFlavor,
  playStartSession,
  playPlaceBuilding,
  playUpgrade,
  playDestroy,
  playAssignCrew,
  playRecruit,
  playPause,
  playResume,
  playBreakStart,
  playBreakEnd,
  playBuildModeOn,
  playBuildModeOff,
  playSelect,
  playDeselect,
  playSelectNpc,
  playResearch,
  playRelocate,
  playError,
  playDailyGoal,
  playMinuteTick,
  playHalfway,
  playFinalStretch,
  playAchievement,
  playMeteor,
  playLockout,
  playImportOk,
  unlockAudio,
} from "@/lib/audio";
import { hapticComplete, hapticFail } from "@/lib/haptics";
import type { GraphicsQuality } from "@/lib/perf";

export type { GraphicsQuality };
import {
  SAVE_VERSION,
  SAVE_STORAGE_KEY,
  sealSave,
  openSave,
  createSealedLocalStorage,
  type SavePayload,
} from "@/lib/save";
import {
  ensureCrewRoster,
  crewSlotsForLevel,
  computeCrewBuffs,
  makeCrewMember,
  normalizeCrewList,
  type CrewMember,
} from "@/lib/crew";

export type { BuildingType };
export type IslandState = "healthy" | "building" | "corrupted";
export type GameStatus =
  | "idle"
  | "running"
  | "paused"
  | "break"
  | "failed"
  | "completed";

export interface Resources {
  crystals: number;
  energy: number;
}

export interface ActiveQuest {
  name: string;
  totalDuration: number;
  timeRemaining: number;
  baseCrystals: number;
  baseEnergy: number;
  tag: SessionTag;
}

export interface PlacedBuilding {
  id: string;
  type: BuildingType;
  level: number;
  position: [number, number, number];
}

export interface LastReward {
  crystals: number;
  energy: number;
  multipliers: { crystals: number; energy: number };
  globalMult: number;
  questName: string;
  suggestedBreakSeconds: number;
}

export interface LastPenalty {
  crystals: number;
  energy: number;
  questName: string;
  failStreak: number;
  earlyMultiplier: number;
  streakMultiplier: number;
}

export interface ActiveBreak {
  total: number;
  remaining: number;
}

export interface GamePrefs {
  soundEnabled: boolean;
  notifyEnabled: boolean;
  zenMode: boolean;
  /** 3D quality: auto adapts to mobile / battery / CPU */
  graphicsQuality: GraphicsQuality;
  /** Keep screen on during focus (where supported) */
  wakeLockEnabled: boolean;
  /** Soft vibration on complete / fail */
  hapticsEnabled: boolean;
}

export interface ResearchState {
  efficientHarvest: boolean;
  resilientCore: boolean;
  calmSignal: boolean;
}

export interface SessionLogEntry {
  id: string;
  at: number;
  name: string;
  tag: SessionTag;
  durationSeconds: number;
  outcome: "complete" | "fail";
  crystals: number;
  energy: number;
}

interface GameState {
  resources: Resources;
  islandState: IslandState;
  activeQuest: ActiveQuest | null;
  activeBreak: ActiveBreak | null;
  status: GameStatus;
  lastReward: LastReward | null;
  lastPenalty: LastPenalty | null;
  /** Epoch ms — cannot start quests until this time */
  lockUntil: number | null;
  preferredFocusMinutes: number;
  preferredTag: SessionTag;

  eventToasts: FiredFocusEvent[];
  eventRuntime: SessionEventRuntime | null;
  lastEventPulseAt: number;
  achievementToasts: { id: string; name: string; icon: IconName }[];

  buildMode: boolean;
  selectedBuildingType: BuildingType | null;
  selectedBuildingId: string | null;
  /** Island NPC / crew member selected for assignment */
  selectedCrewId: string | null;
  /** When true, next free tile click moves selected building */
  relocateMode: boolean;
  placedBuildings: PlacedBuilding[];

  crew: CrewMember[];
  sessionLog: SessionLogEntry[];

  /** Integrity fail / save tampering — triggers meteor punishment */
  cheaterStrike: boolean;
  meteorPulseAt: number;

  hasSeenOnboarding: boolean;
  unlockedAchievements: string[];
  research: ResearchState;
  coreSkin: CoreSkin;
  skySkin: SkySkin;
  prefs: GamePrefs;

  stats: {
    sessionsCompleted: number;
    sessionsFailed: number;
    totalFocusSeconds: number;
    failStreak: number;
    cleanRun: number;
    dailyFocusSeconds: number;
    dailyGoalMinutes: number;
    lastActiveDate: string;
    currentStreak: number;
    longestStreak: number;
    focusByTag: Record<SessionTag, number>;
  };

  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  setPreferredFocusMinutes: (minutes: number) => void;
  setPreferredTag: (tag: SessionTag) => void;
  setDailyGoalMinutes: (m: number) => void;
  setPrefs: (p: Partial<GamePrefs>) => void;
  setCoreSkin: (s: CoreSkin) => void;
  setSkySkin: (s: SkySkin) => void;

  startFocusSession: (opts: {
    minutes?: number;
    seconds?: number;
    tag?: SessionTag;
  }) => { ok: boolean; reason?: string };
  startQuest: (
    name: string,
    duration: number,
    baseCrystals: number,
    baseEnergy: number,
    tag: SessionTag
  ) => { ok: boolean; reason?: string };
  isQuestLocked: () => boolean;
  getLockRemainingMs: () => number;
  tickQuest: () => void;
  tickBreak: () => void;
  pauseQuest: () => void;
  resumeQuest: () => void;
  failQuest: () => void;
  completeQuest: () => void;
  startBreak: () => void;
  skipBreak: () => void;
  dismissEventToast: (instanceId: string) => void;
  dismissAchievementToast: (id: string) => void;
  addResources: (crystals: number, energy: number) => void;
  resetToIdle: () => void;

  toggleBuildMode: () => void;
  selectBuildingType: (type: BuildingType | null) => void;
  selectBuildingId: (id: string | null) => void;
  selectCrewId: (id: string | null) => void;
  clearBuildSelection: () => void;
  setRelocateMode: (on: boolean) => void;
  placeBuilding: (position: [number, number, number]) => {
    ok: boolean;
    reason?: string;
  };
  relocateBuilding: (position: [number, number, number]) => {
    ok: boolean;
    reason?: string;
  };
  destroyBuilding: (id: string) => { ok: boolean; reason?: string };
  upgradeBuilding: (id: string) => { ok: boolean; reason?: string };
  buyResearch: (id: ResearchId) => { ok: boolean; reason?: string };
  assignCrew: (
    crewId: string,
    buildingId: string | null
  ) => { ok: boolean; reason?: string };
  syncCrewSlots: () => void;
  dismissOnboarding: () => void;
  resetProgress: () => void;
  exportSave: () => Record<string, unknown>;
  importSave: (data: unknown) => { ok: boolean; reason?: string };
  ensureDayRollover: () => void;
  punishCheater: (reason?: string) => void;
  clearCheaterStrike: () => void;
}

const emptyFocusByTag = (): Record<SessionTag, number> => ({
  coding: 0,
  study: 0,
  deep_work: 0,
  creative: 0,
  other: 0,
});

const initialResearch: ResearchState = {
  efficientHarvest: false,
  resilientCore: false,
  calmSignal: false,
};

const initialPrefs: GamePrefs = {
  soundEnabled: true,
  notifyEnabled: false,
  zenMode: false,
  graphicsQuality: "auto",
  wakeLockEnabled: true,
  hapticsEnabled: true,
};

const initialState = {
  resources: { crystals: STARTING_CRYSTALS, energy: STARTING_ENERGY },
  islandState: "healthy" as IslandState,
  activeQuest: null as ActiveQuest | null,
  activeBreak: null as ActiveBreak | null,
  status: "idle" as GameStatus,
  lastReward: null as LastReward | null,
  lastPenalty: null as LastPenalty | null,
  lockUntil: null as number | null,
  preferredFocusMinutes: DEFAULT_FOCUS_MINUTES,
  preferredTag: "deep_work" as SessionTag,
  eventToasts: [] as FiredFocusEvent[],
  eventRuntime: null as SessionEventRuntime | null,
  lastEventPulseAt: 0,
  achievementToasts: [] as { id: string; name: string; icon: IconName }[],
  buildMode: false,
  selectedBuildingType: null as BuildingType | null,
  selectedBuildingId: null as string | null,
  selectedCrewId: null as string | null,
  relocateMode: false,
  placedBuildings: [] as PlacedBuilding[],
  crew: [makeCrewMember(0), makeCrewMember(1)] as CrewMember[],
  sessionLog: [] as SessionLogEntry[],
  cheaterStrike: false,
  meteorPulseAt: 0,
  hasSeenOnboarding: false,
  unlockedAchievements: [] as string[],
  research: { ...initialResearch },
  coreSkin: "default" as CoreSkin,
  skySkin: "default" as SkySkin,
  prefs: { ...initialPrefs },
  stats: {
    sessionsCompleted: 0,
    sessionsFailed: 0,
    totalFocusSeconds: 0,
    failStreak: 0,
    cleanRun: 0,
    dailyFocusSeconds: 0,
    dailyGoalMinutes: DEFAULT_DAILY_GOAL_MINUTES,
    lastActiveDate: todayKey(),
    currentStreak: 0,
    longestStreak: 0,
    focusByTag: emptyFocusByTag(),
  },
};

function isFocusSession(status: GameStatus) {
  return status === "running" || status === "paused";
}

function globalRewardMult(state: {
  stats: { currentStreak: number; totalFocusSeconds: number };
  research: ResearchState;
}) {
  const streak = streakRewardMultiplier(state.stats.currentStreak);
  const obs = observatoryRewardMult(
    observatoryLevel(state.stats.totalFocusSeconds).level
  );
  const research = state.research.efficientHarvest ? 1.08 : 1;
  return streak * obs * research;
}

function failMitigationTotal(state: {
  placedBuildings: PlacedBuilding[];
  research: ResearchState;
  crew: CrewMember[];
}) {
  const m = computeMultipliers(state.placedBuildings);
  const crew = computeCrewBuffs(state.crew, state.placedBuildings);
  return Math.min(
    0.7,
    m.failMitigation +
      (state.research.resilientCore ? 0.15 : 0) +
      crew.failMitigation
  );
}

function pushSessionLog(
  log: SessionLogEntry[],
  entry: SessionLogEntry
): SessionLogEntry[] {
  return [entry, ...log].slice(0, 20);
}

function syncCrewFromState(state: {
  stats: { totalFocusSeconds: number };
  crew: CrewMember[];
  prefs?: GamePrefs;
  achievementToasts?: GameState["achievementToasts"];
}): {
  crew: CrewMember[];
  achievementToasts?: GameState["achievementToasts"];
} {
  const lvl = observatoryLevel(state.stats?.totalFocusSeconds ?? 0).level;
  const { crew, newcomers } = ensureCrewRoster(
    state.crew,
    crewSlotsForLevel(lvl)
  );
  // Always return a flat array (repairs nested bad saves)
  if (!newcomers.length) return { crew: normalizeCrewList(crew) };

  if (state.prefs?.soundEnabled) playRecruit(true);

  const toasts = newcomers.slice(0, 2).map((m) => ({
    id: `recruit-${m.id}`,
    name: `${m.name} joined`,
    icon: "steady" as IconName,
  }));
  return {
    crew: normalizeCrewList(crew),
    achievementToasts: [
      ...toasts,
      ...(state.achievementToasts ?? []),
    ].slice(0, 4),
  };
}

function notifyIfNeeded(prefs: GamePrefs, title: string, body: string) {
  if (!prefs.notifyEnabled || typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (document.visibilityState === "visible") return;
  if (Notification.permission === "granted") {
    try {
      new Notification(title, { body, silent: true });
    } catch {
      /* ignore */
    }
  }
}

function applyAchievements(
  state: {
    unlockedAchievements: string[];
    achievementToasts: { id: string; name: string; icon: IconName }[];
    stats: GameState["stats"];
    placedBuildings: PlacedBuilding[];
  },
  patch: Partial<GameState["stats"]> & {
    dailyGoalHit?: boolean;
  }
) {
  const stats = { ...state.stats, ...patch };
  const types = [...new Set(state.placedBuildings.map((b) => b.type))];
  const maxLevel = state.placedBuildings.reduce(
    (m, b) => Math.max(m, b.level),
    0
  );
  const dailyGoalHit =
    patch.dailyGoalHit ??
    stats.dailyFocusSeconds >= stats.dailyGoalMinutes * 60;

  const newly = evaluateNewAchievements(state.unlockedAchievements, {
    sessionsCompleted: stats.sessionsCompleted,
    totalFocusSeconds: stats.totalFocusSeconds,
    currentStreak: stats.currentStreak,
    placedTypes: types,
    maxBuildingLevel: maxLevel,
    cleanRun: stats.cleanRun,
    dailyGoalHit,
    buildingCount: state.placedBuildings.length,
  });

  if (!newly.length) {
    return {
      unlockedAchievements: state.unlockedAchievements,
      achievementToasts: state.achievementToasts,
    };
  }

  const toasts = newly.map((id) => {
    const def = ACHIEVEMENTS.find((a) => a.id === id)!;
    return { id, name: def.name, icon: def.icon };
  });

  return {
    unlockedAchievements: [...state.unlockedAchievements, ...newly],
    achievementToasts: [...toasts, ...state.achievementToasts].slice(0, 4),
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      ensureDayRollover: () => {
        const state = get();
        const today = todayKey();
        if (state.stats.lastActiveDate === today) return;

        const yesterday = yesterdayKey();
        const prev = state.stats.lastActiveDate;
        const metGoal =
          state.stats.dailyFocusSeconds >=
          state.stats.dailyGoalMinutes * 60;

        let currentStreak = state.stats.currentStreak;
        if (prev === yesterday && metGoal) {
          // streak continues when they return after a successful day
          // (already incremented on goal day — keep)
        } else if (prev !== today) {
          // Missed a day → reset if last day wasn't yesterday
          if (prev !== yesterday) currentStreak = 0;
        }

        // Welcome-back gift after a gap (not first-ever install with empty date edge)
        const returningAfterGap =
          Boolean(prev) && prev !== yesterday && prev !== today;
        const gift = returningAfterGap ? COMEBACK_GIFT : null;

        set({
          stats: {
            ...state.stats,
            lastActiveDate: today,
            dailyFocusSeconds: 0,
            currentStreak,
          },
          ...(gift
            ? {
                resources: {
                  crystals: state.resources.crystals + gift.crystals,
                  energy: state.resources.energy + gift.energy,
                },
                eventToasts: [
                  {
                    instanceId: `comeback-${Date.now()}`,
                    defId: "stardust" as const,
                    title: "Welcome back",
                    body: `The island missed you. +${gift.crystals} crystals & +${gift.energy} energy to restart the orbit.`,
                    icon: "sunrise" as IconName,
                    kind: "reward" as const,
                    crystals: gift.crystals,
                    energy: gift.energy,
                    createdAt: Date.now(),
                  },
                  ...state.eventToasts,
                ].slice(0, MAX_VISIBLE_TOASTS),
              }
            : {}),
        });
      },

      setPreferredFocusMinutes: (minutes) =>
        set({ preferredFocusMinutes: clampFocusMinutes(minutes) }),

      setPreferredTag: (tag) => set({ preferredTag: tag }),

      setDailyGoalMinutes: (m) =>
        set((s) => ({
          stats: {
            ...s.stats,
            dailyGoalMinutes: Math.min(
              MAX_DAILY_GOAL,
              Math.max(MIN_DAILY_GOAL, Math.round(m))
            ),
          },
        })),

      setPrefs: (p) =>
        set((s) => ({
          prefs: { ...initialPrefs, ...s.prefs, ...p },
        })),

      setCoreSkin: (coreSkin) => set({ coreSkin }),
      setSkySkin: (skySkin) => set({ skySkin }),

      isQuestLocked: () => getLockRemainingMs(get().lockUntil) > 0,

      getLockRemainingMs: () => getLockRemainingMs(get().lockUntil),

      startFocusSession: ({ minutes, seconds, tag }) => {
        get().ensureDayRollover();
        if (get().isQuestLocked()) {
          return {
            ok: false,
            reason: "Cooldownout active — recover before starting another quest",
          };
        }
        let durationSec: number;
        if (typeof seconds === "number" && seconds > 0) {
          durationSec = Math.round(seconds);
        } else {
          const m = clampFocusMinutes(minutes ?? get().preferredFocusMinutes);
          durationSec = m * 60;
          set({ preferredFocusMinutes: m });
        }
        const reward = rewardsForDuration(durationSec);
        const sessionTag = tag ?? get().preferredTag;
        return get().startQuest(
          reward.name,
          durationSec,
          reward.baseCrystals,
          reward.baseEnergy,
          sessionTag
        );
      },

      startQuest: (name, duration, baseCrystals, baseEnergy, tag) => {
        if (get().isQuestLocked()) {
          return {
            ok: false,
            reason: "Timeout active — recover before starting another quest",
          };
        }
        unlockAudio();
        playStartSession(get().prefs.soundEnabled);
        set({
          activeQuest: {
            name,
            totalDuration: duration,
            timeRemaining: duration,
            baseCrystals,
            baseEnergy,
            tag,
          },
          activeBreak: null,
          status: "running",
          islandState: "building",
          selectedCrewId: null,
          buildMode: false,
          selectedBuildingType: null,
          selectedBuildingId: null,
          lastReward: null,
          lastPenalty: null,
          eventToasts: [],
          eventRuntime: createSessionEventRuntime(duration),
          lastEventPulseAt: 0,
        });
        return { ok: true };
      },

      tickQuest: () => {
        set((state) => {
          if (state.status !== "running" || !state.activeQuest) return state;

          const timeRemaining = Math.max(
            0,
            state.activeQuest.timeRemaining - 1
          );
          const quest = { ...state.activeQuest, timeRemaining };

          let resources = state.resources;
          let eventToasts = state.eventToasts;
          let eventRuntime = state.eventRuntime;
          let lastEventPulseAt = state.lastEventPulseAt;

          if (eventRuntime && timeRemaining > 0) {
            const buildingTypes = [
              ...new Set(state.placedBuildings.map((b) => b.type)),
            ];
            const mults = computeMultipliers(state.placedBuildings);
            const crewBuff = computeCrewBuffs(
              state.crew,
              state.placedBuildings
            );
            const { runtime, events } = tickFocusEvents({
              totalDuration: quest.totalDuration,
              timeRemaining,
              runtime: eventRuntime,
              buildingTypes,
              calmSignal: state.research.calmSignal,
              eventLootMult:
                1 + mults.eventBonus + crewBuff.eventLootBonus,
            });
            eventRuntime = runtime;

            if (events.length > 0) {
              let addC = 0;
              let addE = 0;
              for (const e of events) {
                addC += e.crystals;
                addE += e.energy;
              }
              if (addC || addE) {
                resources = {
                  crystals: resources.crystals + addC,
                  energy: resources.energy + addE,
                };
              }
              eventToasts = [...events, ...eventToasts].slice(
                0,
                MAX_VISIBLE_TOASTS
              );
              lastEventPulseAt = Date.now();
              // Distinct SFX for loot vs flavor vs milestones
              const sound = state.prefs.soundEnabled;
              for (const e of events) {
                if (e.defId === "halfway_signal") playHalfway(sound);
                else if (e.defId === "final_stretch") playFinalStretch(sound);
                else if (e.crystals > 0 || e.energy > 0) playEventTick(sound);
                else playEventFlavor(sound);
              }
            }

            // Soft minute blip (not on the last second)
            if (
              timeRemaining > 0 &&
              timeRemaining % 60 === 0 &&
              quest.totalDuration - timeRemaining > 0
            ) {
              playMinuteTick(state.prefs.soundEnabled);
            }
          }

          return {
            activeQuest: quest,
            resources,
            eventToasts,
            eventRuntime,
            lastEventPulseAt,
          };
        });

        // Single completion path (no parallel useEffect race)
        const after = get();
        if (
          after.status === "running" &&
          after.activeQuest &&
          after.activeQuest.timeRemaining === 0
        ) {
          get().completeQuest();
        }
      },

      tickBreak: () =>
        set((state) => {
          if (state.status !== "break" || !state.activeBreak) return state;
          const remaining = Math.max(0, state.activeBreak.remaining - 1);
          if (remaining === 0) {
            playBreakEnd(state.prefs.soundEnabled);
            return {
              status: "idle" as const,
              islandState: "healthy" as const,
              activeBreak: null,
            };
          }
          return {
            activeBreak: { ...state.activeBreak, remaining },
          };
        }),

      pauseQuest: () =>
        set((state) => {
          if (state.status !== "running" || !state.activeQuest) return state;
          playPause(state.prefs.soundEnabled);
          return { status: "paused", islandState: "building" };
        }),

      resumeQuest: () =>
        set((state) => {
          if (state.status !== "paused" || !state.activeQuest) return state;
          playResume(state.prefs.soundEnabled);
          return {
            status: "running",
            islandState: "building",
            buildMode: false,
          };
        }),

      failQuest: () => {
        const state = get();
        if (!state.activeQuest || !isFocusSession(state.status)) {
          set({
            status: "failed",
            islandState: "corrupted",
            activeQuest: null,
            activeBreak: null,
            buildMode: false,
            eventRuntime: null,
            eventToasts: [],
          });
          return;
        }

        const quest = state.activeQuest;
        const nextStreak = (state.stats.failStreak ?? 0) + 1;
        const penalty = computeFailPenalty({
          crystals: state.resources.crystals,
          energy: state.resources.energy,
          baseCrystals: quest.baseCrystals,
          baseEnergy: quest.baseEnergy,
          totalDuration: quest.totalDuration,
          timeRemaining: quest.timeRemaining,
          failStreak: state.stats.failStreak ?? 0,
          mitigation: failMitigationTotal(state),
        });

        playFailThud(state.prefs.soundEnabled);
        hapticFail(state.prefs.hapticsEnabled ?? true);

        const lockMs = failLockoutMs(nextStreak);
        if (lockMs > 0) playLockout(state.prefs.soundEnabled);
        const lockUntil =
          lockMs > 0 ? Date.now() + lockMs : state.lockUntil;

        set({
          status: "failed",
          islandState: "corrupted",
          activeQuest: null,
          activeBreak: null,
          buildMode: false,
          selectedBuildingType: null,
          selectedBuildingId: null,
          eventRuntime: null,
          eventToasts: [],
          lastReward: null,
          lockUntil,
          lastPenalty: {
            crystals: penalty.crystals,
            energy: penalty.energy,
            questName: quest.name,
            failStreak: nextStreak,
            earlyMultiplier: penalty.earlyMultiplier,
            streakMultiplier: penalty.streakMultiplier,
          },
          resources: {
            crystals: state.resources.crystals - penalty.crystals,
            energy: state.resources.energy - penalty.energy,
          },
          stats: {
            ...state.stats,
            sessionsFailed: state.stats.sessionsFailed + 1,
            failStreak: nextStreak,
            cleanRun: 0,
          },
          sessionLog: pushSessionLog(state.sessionLog, {
            id: `log-${Date.now().toString(36)}`,
            at: Date.now(),
            name: quest.name,
            tag: quest.tag,
            durationSeconds: Math.max(
              1,
              quest.totalDuration - quest.timeRemaining
            ),
            outcome: "fail",
            crystals: -penalty.crystals,
            energy: -penalty.energy,
          }),
        });
      },

      completeQuest: () => {
        const state = get();
        // Single-flight: only complete while a quest is still active
        if (!state.activeQuest) return;
        if (state.status !== "running" && state.status !== "paused") return;

        const quest = state.activeQuest;
        // Clear quest first so a second call no-ops (JS is single-threaded;
        // this still protects against stacked completeQuest invocations)
        set({ activeQuest: null });

        get().ensureDayRollover();
        // Use pre-clear snapshot for rewards
        const gMult = globalRewardMult(state);
        const crewBuff = computeCrewBuffs(state.crew, state.placedBuildings);
        const rewardRaw = computeQuestRewards(
          quest.baseCrystals,
          Math.round(quest.baseEnergy * (1 + crewBuff.energyBonus)),
          state.placedBuildings,
          gMult
        );
        const reward = {
          ...rewardRaw,
          crystals: Math.round(
            rewardRaw.crystals *
              (1 + crewBuff.botanicalBonus + crewBuff.crystalBonus)
          ),
        };

        const totalFocus =
          state.stats.totalFocusSeconds + quest.totalDuration;
        const dailyFocus =
          state.stats.dailyFocusSeconds + quest.totalDuration;
        const goalSec = state.stats.dailyGoalMinutes * 60;
        const wasBelow = state.stats.dailyFocusSeconds < goalSec;
        const nowMet = dailyFocus >= goalSec;

        let currentStreak = state.stats.currentStreak;
        let longest = state.stats.longestStreak;
        let goalBonusC = 0;
        let goalBonusE = 0;
        if (wasBelow && nowMet) {
          currentStreak = currentStreak + 1;
          longest = Math.max(longest, currentStreak);
          goalBonusC = DAILY_GOAL_BONUS.crystals;
          goalBonusE = DAILY_GOAL_BONUS.energy;
        }

        const focusByTag = { ...state.stats.focusByTag };
        focusByTag[quest.tag] =
          (focusByTag[quest.tag] ?? 0) + quest.totalDuration;

        const statsPatch = {
          sessionsCompleted: state.stats.sessionsCompleted + 1,
          totalFocusSeconds: totalFocus,
          dailyFocusSeconds: dailyFocus,
          failStreak: 0,
          cleanRun: state.stats.cleanRun + 1,
          currentStreak,
          longestStreak: longest,
          focusByTag,
          lastActiveDate: todayKey(),
        };

        const ach = applyAchievements(
          {
            unlockedAchievements: state.unlockedAchievements,
            achievementToasts: state.achievementToasts,
            stats: { ...state.stats, ...statsPatch },
            placedBuildings: state.placedBuildings,
          },
          { ...statsPatch, dailyGoalHit: nowMet }
        );

        const totalCrystals = reward.crystals + goalBonusC;
        const totalEnergy = reward.energy + goalBonusE;

        playCompleteChime(state.prefs.soundEnabled);
        if (wasBelow && nowMet) {
          // Staggered so it doesn't fully mask the complete chime
          setTimeout(
            () => playDailyGoal(state.prefs.soundEnabled),
            420
          );
        }
        if (ach.achievementToasts.length > state.achievementToasts.length) {
          setTimeout(
            () => playAchievement(state.prefs.soundEnabled),
            280
          );
        }
        hapticComplete(state.prefs.hapticsEnabled ?? true);
        notifyIfNeeded(
          state.prefs,
          wasBelow && nowMet ? "Daily goal met" : "Quest complete",
          wasBelow && nowMet
            ? `${quest.name} finished. Daily bonus +${goalBonusC}/${goalBonusE}. Total +${totalCrystals}c / +${totalEnergy}e.`
            : `${quest.name} finished. +${reward.crystals} crystals, +${reward.energy} energy.`
        );

        const logEntry: SessionLogEntry = {
          id: `log-${Date.now().toString(36)}`,
          at: Date.now(),
          name: quest.name,
          tag: quest.tag,
          durationSeconds: quest.totalDuration,
          outcome: "complete",
          crystals: totalCrystals,
          energy: totalEnergy,
        };

        const crewSync = syncCrewFromState({
          stats: { ...state.stats, ...statsPatch },
          crew: state.crew,
          prefs: state.prefs,
          achievementToasts: ach.achievementToasts,
        });

        set({
          status: "completed",
          islandState: "healthy",
          activeQuest: null,
          eventRuntime: null,
          eventToasts: [],
          lastPenalty: null,
          lockUntil: null,
          selectedCrewId: null,
          crew: crewSync.crew,
          sessionLog: pushSessionLog(state.sessionLog, logEntry),
          lastReward: {
            crystals: totalCrystals,
            energy: totalEnergy,
            multipliers: reward.multipliers,
            globalMult: reward.globalMult,
            questName:
              wasBelow && nowMet
                ? `${quest.name} · daily goal!`
                : quest.name,
            suggestedBreakSeconds: breakSecondsForSession(quest.totalDuration),
          },
          resources: {
            crystals: state.resources.crystals + totalCrystals,
            energy: state.resources.energy + totalEnergy,
          },
          stats: { ...state.stats, ...statsPatch },
          unlockedAchievements: ach.unlockedAchievements,
          achievementToasts:
            crewSync.achievementToasts ?? ach.achievementToasts,
        });
      },

      startBreak: () => {
        const state = get();
        const secs =
          state.lastReward?.suggestedBreakSeconds ??
          breakSecondsForSession(25 * 60);
        playBreakStart(state.prefs.soundEnabled);
        set({
          status: "break",
          islandState: "healthy",
          activeBreak: { total: secs, remaining: secs },
          lastReward: null,
          lastPenalty: null,
        });
      },

      skipBreak: () => {
        playBreakEnd(get().prefs.soundEnabled);
        set({
          status: "idle",
          islandState: "healthy",
          activeBreak: null,
          lastReward: null,
          lastPenalty: null,
        });
      },

      dismissEventToast: (instanceId) =>
        set((state) => ({
          eventToasts: state.eventToasts.filter(
            (t) => t.instanceId !== instanceId
          ),
        })),

      dismissAchievementToast: (id) =>
        set((s) => ({
          achievementToasts: s.achievementToasts.filter((t) => t.id !== id),
        })),

      addResources: (crystals, energy) =>
        set((state) => ({
          resources: {
            crystals: state.resources.crystals + crystals,
            energy: state.resources.energy + energy,
          },
        })),

      resetToIdle: () =>
        set({
          status: "idle",
          islandState: "healthy",
          activeQuest: null,
          activeBreak: null,
          lastReward: null,
          lastPenalty: null,
          eventRuntime: null,
          eventToasts: [],
        }),

      toggleBuildMode: () =>
        set((state) => {
          if (isFocusSession(state.status) || state.status === "break")
            return state;
          unlockAudio();
          const next = !state.buildMode;
          if (next) playBuildModeOn(state.prefs.soundEnabled);
          else playBuildModeOff(state.prefs.soundEnabled);
          return {
            buildMode: next,
            selectedBuildingType: null,
            selectedBuildingId: null,
            selectedCrewId: null,
            relocateMode: false,
          };
        }),

      selectBuildingType: (type) =>
        set((state) => {
          // Click same type again → unselect
          if (type && state.selectedBuildingType === type) {
            playDeselect(state.prefs.soundEnabled);
            return {
              selectedBuildingType: null,
              selectedBuildingId: null,
              selectedCrewId: null,
              relocateMode: false,
            };
          }
          if (type) playSelect(state.prefs.soundEnabled);
          else playDeselect(state.prefs.soundEnabled);
          return {
            selectedBuildingType: type,
            selectedBuildingId: null,
            selectedCrewId: null,
            relocateMode: false,
          };
        }),

      selectBuildingId: (id) =>
        set((state) => {
          if (isFocusSession(state.status) || state.status === "break") {
            return state;
          }
          unlockAudio();
          if (id && state.selectedBuildingId === id) {
            playDeselect(state.prefs.soundEnabled);
            return {
              selectedBuildingId: null,
              selectedBuildingType: null,
              selectedCrewId: null,
              relocateMode: false,
            };
          }
          if (id) playSelect(state.prefs.soundEnabled);
          return {
            selectedBuildingId: id,
            selectedBuildingType: null,
            selectedCrewId: null,
            relocateMode: false,
            // Direct island click opens manage without forcing place tray
            buildMode: id ? true : state.buildMode,
          };
        }),

      selectCrewId: (id) =>
        set((state) => {
          if (isFocusSession(state.status) || state.status === "break") {
            return state;
          }
          unlockAudio();
          if (id && state.selectedCrewId === id) {
            playDeselect(state.prefs.soundEnabled);
            return { selectedCrewId: null };
          }
          if (id) playSelectNpc(state.prefs.soundEnabled);
          return {
            selectedCrewId: id,
            selectedBuildingId: null,
            selectedBuildingType: null,
            relocateMode: false,
          };
        }),

      clearBuildSelection: () =>
        set({
          selectedBuildingType: null,
          selectedBuildingId: null,
          selectedCrewId: null,
          relocateMode: false,
        }),

      setRelocateMode: (on) =>
        set((state) => ({
          relocateMode: on && !!state.selectedBuildingId,
          selectedBuildingType: null,
        })),

      placeBuilding: (position) => {
        const state = get();
        if (state.relocateMode && state.selectedBuildingId) {
          return get().relocateBuilding(position);
        }
        if (!state.selectedBuildingType) {
          playError(state.prefs.soundEnabled);
          return { ok: false, reason: "No building selected" };
        }
        if (isFocusSession(state.status) || state.status === "break") {
          playError(state.prefs.soundEnabled);
          return { ok: false, reason: "Cannot build during a session" };
        }

        const [x, , z] = position;
        const dist = Math.sqrt(x * x + z * z);
        if (dist < CORE_EXCLUSION_RADIUS) {
          playError(state.prefs.soundEnabled);
          return { ok: false, reason: "Too close to the core" };
        }
        if (dist > ISLAND_PLACE_RADIUS) {
          playError(state.prefs.soundEnabled);
          return { ok: false, reason: "Outside the island" };
        }
        const key = positionKey(Math.round(x), Math.round(z));
        const occupied = state.placedBuildings.some((b) => {
          const [bx, , bz] = b.position;
          return positionKey(Math.round(bx), Math.round(bz)) === key;
        });
        if (occupied) {
          playError(state.prefs.soundEnabled);
          return { ok: false, reason: "Tile already occupied" };
        }

        const cost = getBuildingCost(state.selectedBuildingType);
        if (
          state.resources.crystals < cost.crystals ||
          state.resources.energy < cost.energy
        ) {
          playError(state.prefs.soundEnabled);
          return { ok: false, reason: "Not enough resources" };
        }

        const newBuilding: PlacedBuilding = {
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          type: state.selectedBuildingType,
          level: 1,
          // Canonical ground height (matches Scene ghost / relocate)
          position: [x, 0.26, z],
        };

        const placed = [...state.placedBuildings, newBuilding];
        const ach = applyAchievements(
          {
            unlockedAchievements: state.unlockedAchievements,
            achievementToasts: state.achievementToasts,
            stats: state.stats,
            placedBuildings: placed,
          },
          {}
        );

        playPlaceBuilding(state.prefs.soundEnabled);
        set({
          resources: {
            crystals: state.resources.crystals - cost.crystals,
            energy: state.resources.energy - cost.energy,
          },
          placedBuildings: placed,
          // Stay in place mode for multi-place
          selectedBuildingId: null,
          selectedCrewId: null,
          unlockedAchievements: ach.unlockedAchievements,
          achievementToasts: ach.achievementToasts,
        });

        return { ok: true };
      },

      relocateBuilding: (position) => {
        const state = get();
        if (!state.selectedBuildingId) {
          return { ok: false, reason: "No building selected" };
        }
        if (isFocusSession(state.status) || state.status === "break") {
          return { ok: false, reason: "Cannot move during a session" };
        }

        const [x, , z] = position;
        const dist = Math.sqrt(x * x + z * z);
        if (dist < CORE_EXCLUSION_RADIUS) {
          return { ok: false, reason: "Too close to the core" };
        }
        if (dist > ISLAND_PLACE_RADIUS) {
          return { ok: false, reason: "Outside the island" };
        }
        const key = positionKey(Math.round(x), Math.round(z));
        const occupied = state.placedBuildings.some((b) => {
          if (b.id === state.selectedBuildingId) return false;
          const [bx, , bz] = b.position;
          return positionKey(Math.round(bx), Math.round(bz)) === key;
        });
        if (occupied) return { ok: false, reason: "Tile already occupied" };

        playRelocate(state.prefs.soundEnabled);
        set({
          placedBuildings: state.placedBuildings.map((b) =>
            b.id === state.selectedBuildingId
              ? { ...b, position: [x, 0.26, z] as [number, number, number] }
              : b
          ),
          relocateMode: false,
        });
        return { ok: true };
      },

      destroyBuilding: (id) => {
        const state = get();
        const building = state.placedBuildings.find((b) => b.id === id);
        if (!building) return { ok: false, reason: "Building not found" };
        if (isFocusSession(state.status) || state.status === "break") {
          return { ok: false, reason: "Cannot destroy during a session" };
        }

        const base = getBuildingCost(building.type);
        const mult = 0.45 * (0.8 + building.level * 0.2);
        const refundC = Math.round(base.crystals * mult);
        const refundE = Math.round(base.energy * mult);

        playDestroy(state.prefs.soundEnabled);
        set({
          resources: {
            crystals: state.resources.crystals + refundC,
            energy: state.resources.energy + refundE,
          },
          placedBuildings: state.placedBuildings.filter((b) => b.id !== id),
          crew: normalizeCrewList(state.crew).map((c) =>
            c.assignedBuildingId === id
              ? { ...c, assignedBuildingId: null }
              : c
          ),
          selectedBuildingId: null,
          selectedCrewId: null,
          relocateMode: false,
        });
        return { ok: true };
      },

      upgradeBuilding: (id) => {
        const state = get();
        const building = state.placedBuildings.find((b) => b.id === id);
        if (!building) return { ok: false, reason: "Building not found" };
        if (building.level >= MAX_BUILDING_LEVEL) {
          playError(state.prefs.soundEnabled);
          return { ok: false, reason: "Max level reached" };
        }
        if (isFocusSession(state.status)) {
          playError(state.prefs.soundEnabled);
          return { ok: false, reason: "Cannot upgrade during a session" };
        }

        const raw = getUpgradeCost(building.type, building.level);
        const crewBuff = computeCrewBuffs(state.crew, state.placedBuildings);
        const discount = 1 - crewBuff.upgradeDiscount;
        const cost = {
          crystals:
            raw.crystals === 0
              ? 0
              : Math.max(1, Math.round(raw.crystals * discount)),
          energy:
            raw.energy === 0
              ? 0
              : Math.max(1, Math.round(raw.energy * discount)),
        };

        if (
          state.resources.crystals < cost.crystals ||
          state.resources.energy < cost.energy
        ) {
          playError(state.prefs.soundEnabled);
          return { ok: false, reason: "Not enough resources" };
        }

        const placed = state.placedBuildings.map((b) =>
          b.id === id ? { ...b, level: b.level + 1 } : b
        );
        const ach = applyAchievements(
          {
            unlockedAchievements: state.unlockedAchievements,
            achievementToasts: state.achievementToasts,
            stats: state.stats,
            placedBuildings: placed,
          },
          {}
        );

        playUpgrade(state.prefs.soundEnabled);
        set({
          resources: {
            crystals: state.resources.crystals - cost.crystals,
            energy: state.resources.energy - cost.energy,
          },
          placedBuildings: placed,
          unlockedAchievements: ach.unlockedAchievements,
          achievementToasts: ach.achievementToasts,
        });

        return { ok: true };
      },

      assignCrew: (crewId, buildingId) => {
        const state = get();
        if (isFocusSession(state.status)) {
          return { ok: false, reason: "Assign crew between sessions" };
        }
        if (
          buildingId &&
          !state.placedBuildings.some((b) => b.id === buildingId)
        ) {
          return { ok: false, reason: "Building not found" };
        }
        const roster = normalizeCrewList(state.crew);
        playAssignCrew(state.prefs.soundEnabled);
        set({
          crew: roster.map((c) =>
            c.id === crewId ? { ...c, assignedBuildingId: buildingId } : c
          ),
          selectedCrewId: null,
        });
        return { ok: true };
      },

      syncCrewSlots: () =>
        set((state) => {
          const synced = syncCrewFromState({
            stats: state.stats,
            crew: normalizeCrewList(state.crew),
            prefs: state.prefs,
            achievementToasts: state.achievementToasts,
          });
          return {
            crew: synced.crew,
            ...(synced.achievementToasts
              ? { achievementToasts: synced.achievementToasts }
              : {}),
          };
        }),

      buyResearch: (id) => {
        const state = get();
        const def = RESEARCH[id];
        const key =
          id === "efficient_harvest"
            ? "efficientHarvest"
            : id === "resilient_core"
              ? "resilientCore"
              : "calmSignal";
        if (state.research[key]) {
          playError(state.prefs.soundEnabled);
          return { ok: false, reason: "Already researched" };
        }
        if (
          state.resources.crystals < def.costCrystals ||
          state.resources.energy < def.costEnergy
        ) {
          playError(state.prefs.soundEnabled);
          return { ok: false, reason: "Not enough resources" };
        }
        playResearch(state.prefs.soundEnabled);
        set({
          resources: {
            crystals: state.resources.crystals - def.costCrystals,
            energy: state.resources.energy - def.costEnergy,
          },
          research: { ...state.research, [key]: true },
        });
        return { ok: true };
      },

      dismissOnboarding: () => {
        playSelect(get().prefs.soundEnabled);
        set({ hasSeenOnboarding: true });
      },

      resetProgress: () =>
        set({
          ...initialState,
          hasSeenOnboarding: true,
          _hasHydrated: true,
          lockUntil: null,
          stats: {
            ...initialState.stats,
            lastActiveDate: todayKey(),
            focusByTag: emptyFocusByTag(),
          },
        }),

      exportSave: () => {
        const s = get();
        const payload: SavePayload = {
          version: SAVE_VERSION,
          resources: s.resources,
          placedBuildings: s.placedBuildings,
          crew: s.crew,
          sessionLog: s.sessionLog,
          stats: s.stats as unknown as Record<string, unknown>,
          unlockedAchievements: s.unlockedAchievements,
          research: s.research as unknown as Record<string, unknown>,
          coreSkin: s.coreSkin,
          skySkin: s.skySkin,
          prefs: s.prefs as unknown as Record<string, unknown>,
          preferredFocusMinutes: s.preferredFocusMinutes,
          preferredTag: s.preferredTag,
          lockUntil: s.lockUntil,
          hasSeenOnboarding: s.hasSeenOnboarding,
          islandState: isFocusSession(s.status)
            ? "healthy"
            : s.islandState,
          lastReward: s.lastReward,
          lastPenalty: s.lastPenalty,
        };
        return sealSave(payload) as unknown as Record<string, unknown>;
      },

      importSave: (data) => {
        try {
          const opened = openSave(data);
          if (!opened.ok) {
            if (opened.cheated) {
              get().punishCheater(opened.reason);
              return {
                ok: false,
                reason:
                  opened.reason +
                  " Meteor strike inbound. Resources vaporized.",
              };
            }
            return { ok: false, reason: opened.reason };
          }

          const d = opened.payload;
          set({
            resources: (d.resources as Resources) ?? get().resources,
            placedBuildings: (d.placedBuildings as PlacedBuilding[]) ?? [],
            hasSeenOnboarding: Boolean(d.hasSeenOnboarding),
            unlockedAchievements: d.unlockedAchievements ?? [],
            research: {
              ...initialResearch,
              ...(d.research as Partial<ResearchState>),
            },
            coreSkin: (d.coreSkin as CoreSkin) ?? "default",
            skySkin: (d.skySkin as SkySkin) ?? "default",
            prefs: {
              ...initialPrefs,
              ...(d.prefs as Partial<GamePrefs>),
            },
            preferredFocusMinutes:
              d.preferredFocusMinutes ?? DEFAULT_FOCUS_MINUTES,
            preferredTag: (d.preferredTag as SessionTag) ?? "deep_work",
            lockUntil: d.lockUntil ?? null,
            crew: (() => {
              const imported = normalizeCrewList(d.crew);
              return imported.length ? imported : normalizeCrewList(get().crew);
            })(),
            sessionLog: Array.isArray(d.sessionLog)
              ? (d.sessionLog as SessionLogEntry[])
              : [],
            stats: {
              ...initialState.stats,
              ...(d.stats as Partial<GameState["stats"]>),
              focusByTag: {
                ...emptyFocusByTag(),
                ...((d.stats as GameState["stats"])?.focusByTag ?? {}),
              },
            },
            islandState:
              d.islandState === "corrupted" ? "corrupted" : "healthy",
            status: "idle",
            activeQuest: null,
            activeBreak: null,
            lastReward: null,
            lastPenalty: null,
            eventToasts: [],
            eventRuntime: null,
            buildMode: false,
            relocateMode: false,
            cheaterStrike: false,
          });
          get().syncCrewSlots();
          playImportOk(get().prefs.soundEnabled);
          return { ok: true };
        } catch {
          playError(get().prefs.soundEnabled);
          return { ok: false, reason: "Could not parse save" };
        }
      },

      punishCheater: (reason) => {
        const state = get();
        playMeteor(state.prefs.soundEnabled);
        set({
          cheaterStrike: true,
          meteorPulseAt: Date.now(),
          islandState: "corrupted",
          status: "idle",
          activeQuest: null,
          activeBreak: null,
          buildMode: false,
          resources: {
            crystals: Math.min(state.resources.crystals, 15),
            energy: Math.min(state.resources.energy, 15),
          },
          // Keep buildings/stats so the shame is visible — just nuke liquid loot
          achievementToasts: [
            {
              id: "cheat-meteor",
              name: "Meteor Justice",
              icon: "meteor" as IconName,
            },
            ...state.achievementToasts,
          ].slice(0, 4),
          eventToasts: [
            {
              instanceId: `cheat-${Date.now()}`,
              defId: "meteor_shower" as const,
              title: "Tamper Detected",
              body:
                reason ??
                "Save integrity failed. The sky answers with meteors.",
              icon: "meteor" as IconName,
              kind: "flavor" as const,
              crystals: 0,
              energy: 0,
              createdAt: Date.now(),
            },
            ...state.eventToasts,
          ].slice(0, 3),
        });
      },

      clearCheaterStrike: () =>
        set({
          cheaterStrike: false,
          islandState: "healthy",
        }),
    }),
    {
      name: SAVE_STORAGE_KEY,
      storage: createJSONStorage(() => createSealedLocalStorage()),
      partialize: (state) => ({
        resources: state.resources,
        islandState: isFocusSession(state.status)
          ? "healthy"
          : state.status === "break"
            ? "healthy"
            : state.islandState,
        status:
          isFocusSession(state.status) || state.status === "break"
            ? "idle"
            : state.status === "failed"
              ? "idle"
              : state.status === "completed"
                ? "idle"
                : state.status,
        activeQuest: null,
        activeBreak: null,
        lastReward: state.lastReward,
        lastPenalty: state.lastPenalty,
        preferredFocusMinutes: state.preferredFocusMinutes,
        preferredTag: state.preferredTag,
        lockUntil: state.lockUntil,
        placedBuildings: state.placedBuildings,
        crew: state.crew,
        sessionLog: state.sessionLog,
        hasSeenOnboarding: state.hasSeenOnboarding,
        unlockedAchievements: state.unlockedAchievements,
        research: state.research,
        coreSkin: state.coreSkin,
        skySkin: state.skySkin,
        prefs: state.prefs,
        stats: state.stats,
        cheaterStrike: state.cheaterStrike,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Repair nested crew from earlier builds immediately
        if (state.crew != null && !Array.isArray(state.crew)) {
          state.crew = normalizeCrewList(state.crew);
        }
        // Defer so store methods exist
        queueMicrotask(() => {
          const s = useGameStore.getState();
          // Fill any new pref keys (graphics, wake lock, haptics…)
          s.setPrefs({});
          // Flatten + expand crew slots (fixes bad saves permanently)
          s.syncCrewSlots();
          s.setHasHydrated(true);
          s.ensureDayRollover();
          if (s.cheaterStrike) {
            s.punishCheater(
              "Local save integrity check failed — someone edited the JSON."
            );
          }
        });
      },
    }
  )
);
