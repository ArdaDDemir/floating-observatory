"use client";

import { useEffect, useState } from "react";
import {
  useGameStore,
  type BuildingType,
  type PlacedBuilding,
} from "@/store/useGameStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  BUILDINGS,
  MAX_BUILDING_LEVEL,
  MIN_FOCUS_MINUTES,
  MAX_FOCUS_MINUTES,
  DURATION_PRESETS,
  computeMultipliers,
  computeFailPenalty,
  getUpgradeCost,
  rewardsForDuration,
  clampFocusMinutes,
} from "@/lib/gameConfig";
import { computeCrewBuffs } from "@/lib/crew";
import {
  SESSION_TAGS,
  streakRewardMultiplier,
  getLockRemainingMs,
  formatLockRemaining,
  failLockoutMs,
  type SessionTag,
} from "@/lib/meta";
import Onboarding from "@/components/Onboarding";
import EventToasts from "@/components/EventToasts";
import AchievementToasts from "@/components/AchievementToasts";
import DailyStrip from "@/components/DailyStrip";
import MetaPanel, { type MetaTab } from "@/components/MetaPanel";
import SettingsPanel from "@/components/SettingsPanel";
import GuidePanel from "@/components/GuidePanel";
import StatsPanel from "@/components/StatsPanel";
import { Icon, ResourceCost } from "@/components/icons";
import { useGameHotkeys } from "@/hooks/useGameHotkeys";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useWakeLock } from "@/hooks/useWakeLock";
import { buildingTier } from "@/lib/buildingVisual";
import NpcAssignPanel from "@/components/NpcAssignPanel";
import { unlockAudio, playUiClick, playSelect } from "@/lib/audio";

const TIER_LABEL = {
  1: "Basic",
  2: "Reinforced",
  3: "Legendary",
} as const;

function ToolbarIconButton({
  icon,
  label,
  title,
  onClick,
  active = false,
  emphasize = false,
  compact = false,
}: {
  icon: import("@/lib/iconNames").IconName;
  label: string;
  title: string;
  onClick: () => void;
  active?: boolean;
  emphasize?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`group relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl transition touch-manipulation ${
        compact ? "px-2 py-1.5" : "px-2.5 py-1.5"
      } ${
        emphasize
          ? "bg-sky-500 text-white shadow-[0_0_14px_rgba(14,165,233,0.45)]"
          : active
            ? "bg-white/15 text-white"
            : "text-white/65 hover:bg-white/10 hover:text-white active:bg-white/15"
      }`}
    >
      <Icon name={icon} size={compact ? 18 : 16} />
      <span
        className={`font-bold tracking-wide uppercase ${
          compact ? "text-[8px]" : "text-[9px]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const accentClasses: Record<
  string,
  { border: string; bg: string; text: string; ring: string }
> = {
  amber: {
    border: "border-amber-500/50",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    ring: "ring-amber-400/40",
  },
  violet: {
    border: "border-violet-500/50",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    ring: "ring-violet-400/40",
  },
  emerald: {
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    ring: "ring-emerald-400/40",
  },
  sky: {
    border: "border-sky-500/50",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    ring: "ring-sky-400/40",
  },
  rose: {
    border: "border-rose-500/50",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    ring: "ring-rose-400/40",
  },
};

function UpgradeCard({ building }: { building: PlacedBuilding }) {
  const resources = useGameStore((s) => s.resources);
  const upgradeBuilding = useGameStore((s) => s.upgradeBuilding);
  const destroyBuilding = useGameStore((s) => s.destroyBuilding);
  const setRelocateMode = useGameStore((s) => s.setRelocateMode);
  const relocateMode = useGameStore((s) => s.relocateMode);
  const clearBuildSelection = useGameStore((s) => s.clearBuildSelection);
  const crew = useGameStore((s) => s.crew);
  const placedBuildings = useGameStore((s) => s.placedBuildings);
  const [msg, setMsg] = useState<string | null>(null);

  const def = BUILDINGS[building.type];
  const accent = accentClasses[def.accent];
  const atMax = building.level >= MAX_BUILDING_LEVEL;
  const tier = buildingTier(building.level);
  const nextTier =
    !atMax && buildingTier(building.level + 1) > tier
      ? buildingTier(building.level + 1)
      : null;
  const rawCost = atMax ? null : getUpgradeCost(building.type, building.level);
  const crewBuff = computeCrewBuffs(crew, placedBuildings);
  const discount = 1 - crewBuff.upgradeDiscount;
  const cost = rawCost
    ? {
        crystals:
          rawCost.crystals === 0
            ? 0
            : Math.max(1, Math.round(rawCost.crystals * discount)),
        energy:
          rawCost.energy === 0
            ? 0
            : Math.max(1, Math.round(rawCost.energy * discount)),
      }
    : null;
  const canAfford =
    cost &&
    resources.crystals >= cost.crystals &&
    resources.energy >= cost.energy;
  const assignedCrew = crew.filter(
    (c) => c.assignedBuildingId === building.id
  );
  const discountPct = Math.round(crewBuff.upgradeDiscount * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="pointer-events-auto max-h-[min(70dvh,32rem)] w-full max-w-sm overflow-y-auto hud-scroll rounded-3xl border border-white/15 bg-black/70 p-4 shadow-2xl backdrop-blur-xl sm:p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${accent.bg} ${accent.border} ${accent.text}`}
          >
            <Icon name={def.icon} size={22} />
          </div>
          <div>
            <p
              className={`text-xs font-bold tracking-wider uppercase ${accent.text}`}
            >
              Selected
            </p>
            <h3 className="text-lg font-bold text-white">{def.name}</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={() => clearBuildSelection()}
          className="rounded-lg px-2 py-1 text-xs text-white/40 hover:bg-white/5 hover:text-white"
          title="Deselect"
        >
          <Icon name="close" size={14} />
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">
            Level
          </p>
          <p className="font-mono text-2xl font-black text-white">
            {building.level}
            <span className="text-sm text-white/30"> / {MAX_BUILDING_LEVEL}</span>
          </p>
          <p className="mt-0.5 text-[10px] font-bold tracking-wide text-sky-300/80 uppercase">
            {TIER_LABEL[tier]} form
            {nextTier && (
              <span className="text-amber-300/90">
                {" "}
                → {TIER_LABEL[nextTier]} look
              </span>
            )}
          </p>
        </div>
        <p className="max-w-[50%] text-right text-xs leading-snug text-white/55">
          {def.buffLabel}
        </p>
      </div>

      {msg && (
        <p className="mb-3 text-center text-xs font-medium text-rose-400">
          {msg}
        </p>
      )}

      {assignedCrew.length > 0 && (
        <p className="mb-3 text-[10px] text-white/40">
          Crew here: {assignedCrew.map((c) => c.name).join(", ")}
        </p>
      )}

      {atMax ? (
        <div className="mb-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 py-3 text-center text-sm font-bold text-amber-300">
          Max level reached
        </div>
      ) : (
        <button
          type="button"
          disabled={!canAfford}
          onClick={() => {
            const res = upgradeBuilding(building.id);
            if (!res.ok) setMsg(res.reason ?? "Upgrade failed");
            else setMsg(null);
          }}
          className={`mb-2 w-full rounded-2xl py-3.5 text-sm font-bold transition active:scale-[0.98] ${
            canAfford
              ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-[0_0_24px_rgba(56,189,248,0.35)]"
              : "cursor-not-allowed bg-white/5 text-white/30"
          }`}
        >
          Upgrade to Lv.{building.level + 1}
          {cost && (
            <span className="mt-1 flex flex-col items-center gap-0.5 text-[11px] font-semibold opacity-90">
              <ResourceCost
                crystals={cost.crystals}
                energy={cost.energy}
                size={12}
              />
              {discountPct > 0 && (
                <span className="text-[10px] font-bold text-emerald-300/90">
                  Crew −{discountPct}% upgrade cost
                </span>
              )}
            </span>
          )}
        </button>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setRelocateMode(!relocateMode);
            setMsg(
              !relocateMode
                ? "Click a free tile on the island to move"
                : null
            );
          }}
          className={`rounded-xl border py-2.5 text-xs font-bold transition ${
            relocateMode
              ? "border-amber-400/50 bg-amber-500/20 text-amber-200"
              : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          {relocateMode ? "Cancel move" : "Relocate"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (
              !window.confirm(
                `Destroy ${def.name}? You get a partial refund.`
              )
            )
              return;
            const res = destroyBuilding(building.id);
            if (!res.ok) setMsg(res.reason ?? "Destroy failed");
          }}
          className="rounded-xl border border-rose-500/40 bg-rose-500/15 py-2.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/25"
        >
          Destroy
        </button>
      </div>
      <button
        type="button"
        onClick={() => clearBuildSelection()}
        className="mt-2 w-full rounded-xl py-2 text-[11px] font-semibold text-white/40 hover:text-white/70"
      >
        Deselect
      </button>
    </motion.div>
  );
}

export default function GameHUD() {
  const resources = useGameStore((s) => s.resources);
  const activeQuest = useGameStore((s) => s.activeQuest);
  const activeBreak = useGameStore((s) => s.activeBreak);
  const status = useGameStore((s) => s.status);
  const islandState = useGameStore((s) => s.islandState);
  const buildMode = useGameStore((s) => s.buildMode);
  const selectedBuildingType = useGameStore((s) => s.selectedBuildingType);
  const selectedBuildingId = useGameStore((s) => s.selectedBuildingId);
  const selectedCrewId = useGameStore((s) => s.selectedCrewId);
  const placedBuildings = useGameStore((s) => s.placedBuildings);
  const lastReward = useGameStore((s) => s.lastReward);
  const lastPenalty = useGameStore((s) => s.lastPenalty);
  const stats = useGameStore((s) => s.stats);
  const preferredFocusMinutes = useGameStore((s) => s.preferredFocusMinutes);
  const preferredTag = useGameStore((s) => s.preferredTag);
  const prefs = useGameStore((s) => s.prefs);
  const research = useGameStore((s) => s.research);
  const lockUntil = useGameStore((s) => s.lockUntil);
  const hasHydrated = useGameStore((s) => s._hasHydrated);

  const startFocusSession = useGameStore((s) => s.startFocusSession);
  const setPreferredFocusMinutes = useGameStore(
    (s) => s.setPreferredFocusMinutes
  );
  const setPreferredTag = useGameStore((s) => s.setPreferredTag);
  const pauseQuest = useGameStore((s) => s.pauseQuest);
  const resumeQuest = useGameStore((s) => s.resumeQuest);
  const failQuest = useGameStore((s) => s.failQuest);
  const tickQuest = useGameStore((s) => s.tickQuest);
  const tickBreak = useGameStore((s) => s.tickBreak);
  const startBreak = useGameStore((s) => s.startBreak);
  const skipBreak = useGameStore((s) => s.skipBreak);
  const resetToIdle = useGameStore((s) => s.resetToIdle);
  const toggleBuildMode = useGameStore((s) => s.toggleBuildMode);
  const selectBuildingType = useGameStore((s) => s.selectBuildingType);
  const setPrefs = useGameStore((s) => s.setPrefs);

  const [hoveredItem, setHoveredItem] = useState<BuildingType | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [metaTab, setMetaTab] = useState<MetaTab>("research");
  // null = show store preference (no effect sync needed)
  const [customMinutesDraft, setCustomMinutesDraft] = useState<string | null>(
    null
  );
  const customMinutes =
    customMinutesDraft ?? String(preferredFocusMinutes);
  const setCustomMinutes = setCustomMinutesDraft;
  const [now, setNow] = useState(() => Date.now());
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  /** Mobile focus: user can expand the menu despite auto-collapse */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [questCollapsed, setQuestCollapsed] = useState(false);
  const [mobileSessionDetails, setMobileSessionDetails] = useState(false);
  const isMobile = useIsMobile();

  useGameHotkeys(
    () => {
      setMetaTab("research");
      setMetaOpen(true);
      setSettingsOpen(false);
    },
    () => {
      setMetaOpen(false);
      setSettingsOpen(false);
      setHelpOpen(false);
      setShowStats(false);
    }
  );

  // Unlock WebAudio on first pointer (browser policy)
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (status !== "running") return;
    const timer = setInterval(() => tickQuest(), 1000);
    return () => clearInterval(timer);
  }, [status, tickQuest]);

  useEffect(() => {
    if (status !== "break") return;
    const timer = setInterval(() => tickBreak(), 1000);
    return () => clearInterval(timer);
  }, [status, tickBreak]);

  // Live countdown while abandon lock is active
  useEffect(() => {
    if (!lockUntil || lockUntil <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lockUntil]);

  const inventory = Object.values(BUILDINGS);
  const hoveredData = inventory.find((i) => i.id === hoveredItem);
  const selectedTypeData = selectedBuildingType
    ? BUILDINGS[selectedBuildingType]
    : null;
  const buildInfo = selectedTypeData ?? hoveredData ?? null;
  const selectedBuilding = placedBuildings.find(
    (b) => b.id === selectedBuildingId
  );
  const multipliers = computeMultipliers(placedBuildings);
  const sessionActive = status === "running" || status === "paused";
  const zen = prefs.zenMode;

  // Focus-first mobile: collapse toolbar during session unless user opens it
  const toolbarHidden =
    toolbarCollapsed || (isMobile && sessionActive && !mobileMenuOpen);

  useWakeLock(
    status === "running",
    Boolean(prefs.wakeLockEnabled ?? true)
  );

  const selectedMinutes = clampFocusMinutes(
    Number(customMinutes) || preferredFocusMinutes
  );
  const previewReward = rewardsForDuration(selectedMinutes * 60);
  const streakMult = streakRewardMultiplier(stats.currentStreak);
  const lockRemaining = getLockRemainingMs(lockUntil, now);
  const questLocked = lockRemaining > 0;

  const previewPenalty =
    sessionActive && activeQuest
      ? computeFailPenalty({
          crystals: resources.crystals,
          energy: resources.energy,
          baseCrystals: activeQuest.baseCrystals,
          baseEnergy: activeQuest.baseEnergy,
          totalDuration: activeQuest.totalDuration,
          timeRemaining: activeQuest.timeRemaining,
          failStreak: stats.failStreak ?? 0,
          mitigation: Math.min(
            0.7,
            multipliers.failMitigation + (research.resilientCore ? 0.15 : 0)
          ),
        })
      : null;

  if (!hasHydrated) {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-black/50 px-6 py-3 text-sm text-white/50 backdrop-blur-md">
          Syncing observatory…
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none safe-pad absolute inset-0 z-10 flex flex-col justify-between font-sans landscape-compact sm:p-6">
      <Onboarding />
      <EventToasts />
      <AchievementToasts />
      {metaOpen && (
        <MetaPanel
          tab={metaTab}
          onTabChange={setMetaTab}
          onClose={() => setMetaOpen(false)}
        />
      )}
      {settingsOpen && (
        <SettingsPanel onClose={() => setSettingsOpen(false)} />
      )}

      {/* Top bar */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {!zen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2"
          >
            <div className="flex flex-wrap gap-1.5 sm:gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/45 p-2 shadow-2xl backdrop-blur-md sm:gap-3 sm:p-4">
                <div className="rounded-lg bg-sky-500/20 p-1.5 text-sky-400 sm:rounded-xl sm:p-2">
                  <Icon name="crystal" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold tracking-wider text-sky-200/70 uppercase sm:text-[10px]">
                    Crystals
                  </p>
                  <div className="flex items-end gap-1 sm:gap-1.5">
                    <p className="text-lg font-bold text-white sm:text-2xl">
                      {resources.crystals}
                    </p>
                    <p className="mb-0.5 text-[10px] font-bold text-sky-400 sm:text-[11px]">
                      {multipliers.crystals.toFixed(2)}×
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/45 p-2 shadow-2xl backdrop-blur-md sm:gap-3 sm:p-4">
                <div className="rounded-lg bg-amber-500/20 p-1.5 text-amber-400 sm:rounded-xl sm:p-2">
                  <Icon name="energy" size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold tracking-wider text-amber-200/70 uppercase sm:text-[10px]">
                    Energy
                  </p>
                  <div className="flex items-end gap-1 sm:gap-1.5">
                    <p className="text-lg font-bold text-white sm:text-2xl">
                      {resources.energy}
                    </p>
                    <p className="mb-0.5 text-[10px] font-bold text-amber-400 sm:text-[11px]">
                      {multipliers.energy.toFixed(2)}×
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {(status === "idle" || !sessionActive) && !buildMode && (
              <div className="hidden min-[400px]:block sm:block">
                <DailyStrip />
              </div>
            )}
          </motion.div>
        )}

        {zen && sessionActive && activeQuest && (
          <div className="pointer-events-none rounded-2xl border border-white/10 bg-black/50 px-4 py-2 font-mono text-3xl font-black text-white backdrop-blur-md">
            {formatTime(activeQuest.timeRemaining)}
          </div>
        )}

        <div className="pointer-events-auto ml-auto flex flex-col items-end gap-2 sm:gap-3">
          {/* Compact strip when toolbar collapsed */}
          {toolbarHidden ? (
            <button
              type="button"
              onClick={() => {
                setToolbarCollapsed(false);
                if (isMobile && sessionActive) setMobileMenuOpen(true);
              }}
              title="Expand controls"
              className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-black/60 px-3 py-2 text-white/80 shadow-xl backdrop-blur-md transition hover:bg-white/10 hover:text-white touch-manipulation"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "running"
                    ? "bg-emerald-400"
                    : status === "paused"
                      ? "bg-amber-400"
                      : status === "break"
                        ? "bg-sky-400"
                        : islandState === "corrupted"
                          ? "bg-rose-400"
                          : "bg-white/40"
                }`}
              />
              <Icon name="panelMax" size={16} />
              <span className="text-[10px] font-bold tracking-wide uppercase">
                Menu
              </span>
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide backdrop-blur-md ${
                    status === "paused"
                      ? "border-amber-400/50 bg-amber-500/20 text-amber-300"
                      : status === "break"
                        ? "border-sky-400/50 bg-sky-500/20 text-sky-300"
                        : islandState === "corrupted"
                          ? "border-red-500/50 bg-red-500/20 text-red-400"
                          : islandState === "building"
                            ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                            : "border-white/20 bg-white/10 text-white/80"
                  }`}
                >
                  {status === "paused"
                    ? "Paused"
                    : status === "break"
                      ? "On break"
                      : status === "running"
                        ? "Focusing"
                        : islandState === "corrupted"
                          ? "Corrupted"
                          : "Idle"}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setToolbarCollapsed(true);
                    setMobileMenuOpen(false);
                  }}
                  title="Minimize menu"
                  className="min-h-11 min-w-11 rounded-xl border border-white/10 bg-black/50 p-1.5 text-white/45 backdrop-blur-md transition hover:bg-white/10 hover:text-white touch-manipulation"
                >
                  <Icon name="panelMin" size={14} />
                </button>
              </div>

              <div className="flex max-w-[min(100vw-5rem,22rem)] flex-wrap items-center justify-end gap-0.5 rounded-2xl border border-white/10 bg-black/55 p-1 shadow-xl backdrop-blur-md sm:max-w-none sm:gap-1.5 sm:p-1.5">
                {!zen && (
                  <>
                    <ToolbarIconButton
                      compact
                      icon="hub"
                      label="Lab"
                      title="Lab — research, looks, crew, badges"
                      active={metaOpen}
                      onClick={() => {
                        setSettingsOpen(false);
                        if (metaOpen) setMetaOpen(false);
                        else {
                          setMetaTab("research");
                          setMetaOpen(true);
                        }
                      }}
                    />
                    <ToolbarIconButton
                      compact
                      icon="settings"
                      label="Set"
                      title="Settings — sound, goals, zen, save"
                      active={settingsOpen}
                      onClick={() => {
                        setMetaOpen(false);
                        setSettingsOpen((v) => !v);
                      }}
                    />
                    <ToolbarIconButton
                      compact
                      icon="guide"
                      label="Help"
                      title="Guide — how the observatory works"
                      active={helpOpen}
                      onClick={() => {
                        setHelpOpen((v) => !v);
                        setShowStats(false);
                      }}
                    />
                    <ToolbarIconButton
                      compact
                      icon="stats"
                      label="Stats"
                      title="Stats — focus log, streak, journal"
                      active={showStats}
                      onClick={() => {
                        setShowStats((v) => !v);
                        setHelpOpen(false);
                      }}
                    />
                  </>
                )}
                <ToolbarIconButton
                  compact
                  icon={zen ? "zenOff" : "zen"}
                  label={zen ? "HUD" : "Zen"}
                  title={
                    zen
                      ? "Show full HUD again"
                      : "Zen — hide panels, only timer"
                  }
                  active={zen}
                  onClick={() => setPrefs({ zenMode: !zen })}
                />
                {!sessionActive && status !== "break" && !zen && (
                  <>
                    <div className="mx-0.5 hidden h-7 w-px bg-white/10 sm:block" />
                    <ToolbarIconButton
                      compact
                      icon="build"
                      label={buildMode ? "Done" : "Build"}
                      title={
                        buildMode
                          ? "Exit build mode"
                          : "Build — place & upgrade structures"
                      }
                      active={buildMode}
                      onClick={toggleBuildMode}
                      emphasize={buildMode}
                    />
                  </>
                )}
              </div>
            </>
          )}

          <AnimatePresence>
            {showStats && !zen && !toolbarHidden && (
              <StatsPanel onClose={() => setShowStats(false)} />
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {helpOpen && <GuidePanel onClose={() => setHelpOpen(false)} />}
      </AnimatePresence>

      {/* Bottom */}
      <div className="safe-pad-b flex w-full items-end justify-between gap-2 sm:gap-4">
        {!buildMode && !zen && (
          <div className="pointer-events-auto w-full max-w-full sm:max-w-sm">
            {/* Quest panel minimize */}
            <div className="mb-2 flex justify-start">
              <button
                type="button"
                onClick={() => setQuestCollapsed((v) => !v)}
                title={questCollapsed ? "Expand quest panel" : "Minimize quest panel"}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white/50 uppercase backdrop-blur-md transition hover:bg-white/10 hover:text-white/80"
              >
                <Icon
                  name={questCollapsed ? "panelMax" : "panelMin"}
                  size={12}
                />
                {questCollapsed ? "Quest" : "Hide"}
              </button>
            </div>

            {questCollapsed ? (
              <button
                type="button"
                onClick={() => setQuestCollapsed(false)}
                className="w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-left shadow-xl backdrop-blur-xl transition hover:border-white/20"
              >
                <p className="text-[10px] font-bold tracking-wider text-white/40 uppercase">
                  {status === "running" || status === "paused"
                    ? "Active"
                    : status === "break"
                      ? "Break"
                      : status === "completed"
                        ? "Complete"
                        : status === "failed"
                          ? "Failed"
                          : "Ready"}
                </p>
                <p className="mt-0.5 font-mono text-xl font-black text-white">
                  {sessionActive && activeQuest
                    ? formatTime(activeQuest.timeRemaining)
                    : status === "break" && activeBreak
                      ? formatTime(activeBreak.remaining)
                      : status === "completed"
                        ? "Done"
                        : status === "failed"
                          ? "Corrupted"
                          : "Start focus"}
                </p>
                <p className="mt-1 text-[10px] text-white/35">
                  Tap to expand quest panel
                </p>
              </button>
            ) : (
            <AnimatePresence mode="wait">
              {status === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className={`max-h-[min(58dvh,34rem)] overflow-y-auto hud-scroll rounded-3xl border p-4 shadow-2xl backdrop-blur-xl sm:max-h-none sm:overflow-visible sm:p-6 ${
                    questLocked
                      ? "border-red-500/35 bg-black/70"
                      : "border-white/10 bg-black/55"
                  }`}
                >
                  <p
                    className={`mb-1 text-[11px] font-bold tracking-[0.16em] uppercase ${
                      questLocked
                        ? "text-red-400/90"
                        : "text-emerald-400/90"
                    }`}
                  >
                    {questLocked ? "Timeout" : "Ready"}
                  </p>
                  <h3 className="mb-3 text-xl font-bold text-white">
                    {questLocked ? "Focus cooldown" : "New Focus Quest"}
                  </h3>

                  {questLocked && (
                    <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center">
                      <p className="mb-1 text-xs text-red-100/70">
                        Too many abandoned sessions. New quests are locked
                        until the core stabilizes.
                      </p>
                      <p className="font-mono text-3xl font-black text-red-300">
                        {formatLockRemaining(lockRemaining)}
                      </p>
                      <p className="mt-1 text-[10px] text-red-200/45">
                        Fail streak {stats.failStreak} · build mode still
                        available
                      </p>
                    </div>
                  )}

                  <p className="mb-2 text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                    Intent
                  </p>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {SESSION_TAGS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          playSelect(prefs.soundEnabled);
                          setPreferredTag(t.id as SessionTag);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                          preferredTag === t.id
                            ? "bg-violet-500 text-white"
                            : "border border-white/10 bg-white/5 text-white/55 hover:bg-white/10"
                        }`}
                      >
                        <Icon name={t.icon} size={12} />
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <p className="mb-2 text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                    Duration
                  </p>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {DURATION_PRESETS.map((p) => {
                      const active = selectedMinutes === p.minutes;
                      return (
                        <button
                          key={p.minutes}
                          type="button"
                          onClick={() => {
                            playUiClick(prefs.soundEnabled);
                            setCustomMinutes(String(p.minutes));
                            setPreferredFocusMinutes(p.minutes);
                          }}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            active
                              ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                              : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <input
                      id="custom-minutes"
                      type="number"
                      min={MIN_FOCUS_MINUTES}
                      max={MAX_FOCUS_MINUTES}
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      onBlur={() => {
                        const m = clampFocusMinutes(Number(customMinutes));
                        setCustomMinutes(String(m));
                        setPreferredFocusMinutes(m);
                      }}
                      className="w-20 rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 font-mono text-base text-white outline-none focus:border-emerald-400/50 sm:text-sm"
                    />
                    <span className="text-xs text-white/45">minutes</span>
                  </div>

                  <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/55">
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span>Est. base</span>
                      <ResourceCost
                        crystals={previewReward.baseCrystals}
                        energy={previewReward.baseEnergy}
                        size={12}
                        showZero
                      />
                      {streakMult > 1 && (
                        <span className="text-amber-300">
                          streak {streakMult.toFixed(2)}x
                        </span>
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={questLocked}
                    onClick={() => {
                      if (questLocked) return;
                      const m = clampFocusMinutes(Number(customMinutes));
                      setCustomMinutes(String(m));
                      startFocusSession({ minutes: m, tag: preferredTag });
                    }}
                    className={`w-full rounded-2xl py-4 text-base font-bold transition active:scale-[0.98] ${
                      questLocked
                        ? "cursor-not-allowed bg-white/5 text-white/30"
                        : "bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:from-emerald-400 hover:to-teal-300"
                    }`}
                  >
                    {questLocked
                      ? `Locked · ${formatLockRemaining(lockRemaining)}`
                      : `Start · ${formatTime(selectedMinutes * 60)}`}
                  </button>
                  <button
                    type="button"
                    disabled={questLocked}
                    onClick={() => {
                      if (questLocked) return;
                      startFocusSession({ seconds: 5, tag: preferredTag });
                    }}
                    className={`mt-2 w-full rounded-2xl py-2.5 text-xs font-medium transition ${
                      questLocked
                        ? "cursor-not-allowed text-white/20"
                        : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white/70"
                    }`}
                  >
                    Quick test · 5 seconds
                  </button>
                </motion.div>
              )}

              {sessionActive && activeQuest && (
                <motion.div
                  key="session"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl ${
                    status === "paused"
                      ? "border-amber-400/35 bg-black/70"
                      : "border-emerald-500/30 bg-black/65"
                  } ${
                    isMobile
                      ? "p-4"
                      : "p-5 sm:p-6"
                  }`}
                >
                  <div
                    className={`absolute top-0 left-0 h-1 transition-all duration-1000 ease-linear ${
                      status === "paused" ? "bg-amber-400" : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${
                        ((activeQuest.totalDuration -
                          activeQuest.timeRemaining) /
                          activeQuest.totalDuration) *
                        100
                      }%`,
                    }}
                  />
                  {/* Mobile: focus-first timer strip */}
                  {isMobile ? (
                    <>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p
                          className={`text-[10px] font-bold tracking-wider uppercase ${
                            status === "paused"
                              ? "text-amber-300"
                              : "text-emerald-400"
                          }`}
                        >
                          {status === "paused" ? "Paused" : "Focus"}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setMobileSessionDetails((v) => !v)
                          }
                          className="text-[10px] font-bold text-white/40 underline-offset-2 touch-manipulation hover:text-white/70"
                        >
                          {mobileSessionDetails ? "Less" : "Details"}
                        </button>
                      </div>
                      <div className="mb-3 text-center font-mono text-5xl font-black tracking-tighter text-white">
                        {formatTime(activeQuest.timeRemaining)}
                      </div>
                      {mobileSessionDetails && (
                        <div className="mb-3 space-y-2">
                          <p className="text-center text-sm text-white/70">
                            {activeQuest.name}
                          </p>
                          {previewPenalty && (
                            <p className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-[11px] text-red-200/70">
                              <span>Give up</span>
                              <span className="inline-flex items-center gap-0.5 text-red-300">
                                −
                                <Icon
                                  name="crystal"
                                  size={11}
                                  className="text-sky-400"
                                />
                                {previewPenalty.crystals}
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-red-300">
                                −
                                <Icon
                                  name="energy"
                                  size={11}
                                  className="text-amber-400"
                                />
                                {previewPenalty.energy}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        {status === "running" ? (
                          <button
                            type="button"
                            onClick={pauseQuest}
                            className="min-h-12 flex-1 rounded-xl border border-amber-400/40 bg-amber-500/15 py-3 text-base font-bold text-amber-200 touch-manipulation"
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={resumeQuest}
                            className="min-h-12 flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-base font-bold text-white touch-manipulation"
                          >
                            Resume
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={failQuest}
                          className="min-h-12 rounded-xl border border-red-500/50 bg-red-500/20 px-4 py-3 text-sm font-bold text-red-400 touch-manipulation"
                        >
                          End
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3
                        className={`mb-1 text-xs font-bold tracking-wider uppercase ${
                          status === "paused"
                            ? "text-amber-300"
                            : "text-emerald-400"
                        }`}
                      >
                        {status === "paused" ? "Paused" : "Active Quest"}
                      </h3>
                      <p className="mb-1 text-lg font-medium text-white">
                        {activeQuest.name}
                      </p>
                      <p className="mb-3 inline-flex items-center gap-1.5 text-[11px] text-white/40">
                        <Icon
                          name={
                            SESSION_TAGS.find((t) => t.id === activeQuest.tag)
                              ?.icon ?? "sparkles"
                          }
                          size={12}
                        />
                        {
                          SESSION_TAGS.find((t) => t.id === activeQuest.tag)
                            ?.label
                        }
                      </p>
                      <div className="mb-4 font-mono text-5xl font-black tracking-tighter text-white sm:text-6xl">
                        {formatTime(activeQuest.timeRemaining)}
                      </div>

                      {status === "paused" && (
                        <p className="mb-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-100/70">
                          Timer frozen. Space to resume.
                        </p>
                      )}

                      {previewPenalty && (
                        <p className="mb-3 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-[11px] text-red-200/70">
                          <span>Give up cost</span>
                          <span className="inline-flex items-center gap-0.5 text-red-300">
                            −
                            <Icon
                              name="crystal"
                              size={11}
                              className="text-sky-400"
                            />
                            {previewPenalty.crystals}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-red-300">
                            −
                            <Icon
                              name="energy"
                              size={11}
                              className="text-amber-400"
                            />
                            {previewPenalty.energy}
                          </span>
                        </p>
                      )}

                      <div className="mb-2 flex gap-2">
                        {status === "running" ? (
                          <button
                            type="button"
                            onClick={pauseQuest}
                            className="flex-1 rounded-xl border border-amber-400/40 bg-amber-500/15 py-3 font-bold text-amber-200 transition hover:bg-amber-500/25"
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={resumeQuest}
                            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 font-bold text-white"
                          >
                            Resume
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={failQuest}
                        className="w-full rounded-xl border border-red-500/50 bg-red-500/20 py-3 font-bold text-red-400 transition hover:bg-red-500/30"
                      >
                        Give Up
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {status === "completed" && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  className="rounded-3xl border border-sky-500/50 bg-black/65 p-5 shadow-[0_0_40px_rgba(59,130,246,0.2)] backdrop-blur-xl sm:p-6"
                >
                  <h3 className="mb-1 text-2xl font-bold text-sky-400">
                    Quest Complete
                  </h3>
                  <p className="mb-4 text-sm text-sky-100/60">
                    {lastReward?.questName ?? "Session"} finished.
                  </p>
                  {lastReward && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-3 py-3 text-center">
                        <p className="text-[10px] font-semibold text-sky-200/60 uppercase">
                          Crystals
                        </p>
                        <p className="text-xl font-black text-white">
                          +{lastReward.crystals}
                        </p>
                        <p className="text-[10px] text-sky-300/70">
                          ×{lastReward.globalMult.toFixed(2)} global
                        </p>
                      </div>
                      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-3 text-center">
                        <p className="text-[10px] font-semibold text-amber-200/60 uppercase">
                          Energy
                        </p>
                        <p className="text-xl font-black text-white">
                          +{lastReward.energy}
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={startBreak}
                    className="mb-2 w-full rounded-2xl bg-sky-500 py-3.5 font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                  >
                    Take break ·{" "}
                    {formatTime(lastReward?.suggestedBreakSeconds ?? 300)}
                  </button>
                  <button
                    type="button"
                    onClick={skipBreak}
                    className="w-full rounded-2xl bg-white/10 py-3 text-sm font-bold text-white/70 hover:bg-white/15"
                  >
                    Skip break
                  </button>
                </motion.div>
              )}

              {status === "break" && activeBreak && (
                <motion.div
                  key="break"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-3xl border border-sky-400/35 bg-black/65 p-5 backdrop-blur-xl sm:p-6"
                >
                  <h3 className="mb-1 text-xs font-bold tracking-wider text-sky-300 uppercase">
                    Break
                  </h3>
                  <p className="mb-3 text-sm text-white/55">
                    Step away. The island rests with you.
                  </p>
                  <div className="mb-4 font-mono text-5xl font-black text-sky-100">
                    {formatTime(activeBreak.remaining)}
                  </div>
                  <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-sky-400 transition-all duration-1000"
                      style={{
                        width: `${
                          ((activeBreak.total - activeBreak.remaining) /
                            activeBreak.total) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={skipBreak}
                    className="w-full rounded-2xl border border-white/15 bg-white/5 py-3 font-bold text-white/70 hover:bg-white/10"
                  >
                    End break early
                  </button>
                </motion.div>
              )}

              {status === "failed" && (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  className="rounded-3xl border border-red-500/40 bg-black/70 p-5 backdrop-blur-xl sm:p-6"
                >
                  <h3 className="mb-1 text-2xl font-bold text-red-400">
                    Core Corrupted
                  </h3>
                  <p className="mb-4 text-sm text-red-100/55">
                    Session abandoned. Resources bled to stabilize.
                  </p>
                  {lastPenalty && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-3 py-3 text-center">
                        <p className="text-[10px] text-red-200/50 uppercase">
                          Crystals
                        </p>
                        <p className="text-xl font-black text-red-300">
                          −{lastPenalty.crystals}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-3 py-3 text-center">
                        <p className="text-[10px] text-red-200/50 uppercase">
                          Energy
                        </p>
                        <p className="text-xl font-black text-red-300">
                          −{lastPenalty.energy}
                        </p>
                      </div>
                    </div>
                  )}
                  {lastPenalty &&
                    failLockoutMs(lastPenalty.failStreak) > 0 && (
                      <p className="mb-4 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-100/75">
                        Timeout applied:{" "}
                        <span className="font-bold text-amber-200">
                          {formatLockRemaining(
                            failLockoutMs(lastPenalty.failStreak)
                          )}
                        </span>{" "}
                        before the next quest (streak{" "}
                        {lastPenalty.failStreak}).
                      </p>
                    )}
                  <button
                    type="button"
                    onClick={resetToIdle}
                    className="w-full rounded-2xl border border-red-400/40 bg-red-500/20 py-4 font-bold text-red-200"
                  >
                    Stabilize Observatory
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            )}
          </div>
        )}

        {/* Zen session controls */}
        {zen && sessionActive && (
          <div className="pointer-events-auto mx-auto flex gap-2">
            {status === "running" ? (
              <button
                type="button"
                onClick={pauseQuest}
                className="rounded-2xl border border-amber-400/40 bg-black/60 px-6 py-3 font-bold text-amber-200 backdrop-blur-md"
              >
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={resumeQuest}
                className="rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-white"
              >
                Resume
              </button>
            )}
          </div>
        )}

        {/* Island NPC assign panel (click crew on island) */}
        {!zen && !sessionActive && selectedCrewId && (
          <div className="pointer-events-auto mb-2 flex w-full justify-center sm:mb-3">
            <NpcAssignPanel />
          </div>
        )}

        {/* Direct upgrade: click building on island (buildMode auto-on) */}
        {!zen && !sessionActive && selectedBuilding && !selectedBuildingType && (
          <div className="pointer-events-auto mb-2 flex w-full justify-center sm:mb-3">
            <UpgradeCard building={selectedBuilding} />
          </div>
        )}

        {buildMode && !zen && !selectedBuilding && (
          <div className="flex w-full flex-col items-center gap-2 sm:gap-3">
            <p className="max-w-[min(100%,22rem)] rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-center text-[11px] text-white/50 sm:px-4 sm:text-xs">
              {selectedBuildingType
                ? "Tap island to place · tap type again to deselect"
                : "Pick a type · or tap a building / NPC on the island"}
            </p>
            {/* Touch + desktop: show selected / hovered building info */}
            <AnimatePresence>
              {buildInfo && !selectedBuilding && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="pointer-events-none flex w-full max-w-sm flex-col items-center rounded-2xl border border-white/20 bg-black/80 px-4 py-3 backdrop-blur-xl"
                >
                  <p
                    className={`mb-0.5 text-base font-bold ${
                      accentClasses[buildInfo.accent].text
                    }`}
                  >
                    {buildInfo.name}
                  </p>
                  <p className="mb-1 text-center text-xs text-white/55">
                    {buildInfo.description}
                  </p>
                  <p className="mb-1.5 text-center text-sm font-medium text-white">
                    {buildInfo.buffLabel}
                  </p>
                  <ResourceCost
                    crystals={buildInfo.costCrystals}
                    energy={buildInfo.costEnergy}
                    size={12}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="pointer-events-auto max-w-full overflow-x-auto hud-scroll pb-1"
            >
              <div className="flex gap-2 rounded-3xl border border-white/20 bg-black/75 p-2 backdrop-blur-xl sm:gap-3 sm:p-4">
                {inventory.map((item) => {
                  const canAfford =
                    resources.crystals >= item.costCrystals &&
                    resources.energy >= item.costEnergy;
                  const accent = accentClasses[item.accent];
                  const selected = selectedBuildingType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        selectBuildingType(item.id);
                        setHoveredItem(item.id);
                      }}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`flex min-h-16 w-[4.75rem] shrink-0 flex-col items-center gap-1 rounded-2xl p-2 transition touch-manipulation sm:w-28 sm:gap-1.5 sm:p-3 ${
                        selected
                          ? `scale-105 border-2 ${accent.border} bg-white/10 ring-2 ${accent.ring}`
                          : "border border-white/10 hover:border-white/30 hover:bg-white/5 active:bg-white/10"
                      } ${!canAfford ? "opacity-50 grayscale" : ""}`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border ${accent.bg} ${accent.border} ${accent.text}`}
                      >
                        <Icon name={item.icon} size={18} />
                      </div>
                      <p className="text-center text-[11px] font-bold text-white">
                        {item.name}
                      </p>
                      <ResourceCost
                        crystals={item.costCrystals}
                        energy={item.costEnergy}
                        size={11}
                        className="text-[10px] text-white/70"
                      />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
