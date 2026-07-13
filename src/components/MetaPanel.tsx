"use client";

import { useGameStore } from "@/store/useGameStore";
import {
  ACHIEVEMENTS,
  RESEARCH,
  CORE_SKINS,
  SKY_SKINS,
  isCosmeticUnlocked,
  observatoryLevel,
  type ResearchId,
} from "@/lib/meta";
import { CREW_ROLES, crewSlotsForLevel, normalizeCrewList } from "@/lib/crew";
import { Icon, ResourceCost } from "@/components/icons";
import { BUILDINGS } from "@/lib/gameConfig";
import type { IconName } from "@/lib/iconNames";

export type MetaTab = "research" | "cosmetics" | "crew" | "badges";

const TABS: { id: MetaTab; label: string; icon: IconName }[] = [
  { id: "research", label: "Research", icon: "hub" },
  { id: "cosmetics", label: "Looks", icon: "sparkles" },
  { id: "crew", label: "Crew", icon: "steady" },
  { id: "badges", label: "Badges", icon: "star" },
];

export default function MetaPanel({
  onClose,
  tab,
  onTabChange,
}: {
  onClose: () => void;
  tab: MetaTab;
  onTabChange: (t: MetaTab) => void;
}) {
  const resources = useGameStore((s) => s.resources);
  const stats = useGameStore((s) => s.stats);
  const unlocked = useGameStore((s) => s.unlockedAchievements);
  const research = useGameStore((s) => s.research);
  const buyResearch = useGameStore((s) => s.buyResearch);
  const coreSkin = useGameStore((s) => s.coreSkin);
  const skySkin = useGameStore((s) => s.skySkin);
  const setCoreSkin = useGameStore((s) => s.setCoreSkin);
  const setSkySkin = useGameStore((s) => s.setSkySkin);
  const crewRaw = useGameStore((s) => s.crew);
  const crew = normalizeCrewList(crewRaw);
  const buildings = useGameStore((s) => s.placedBuildings);
  const assignCrew = useGameStore((s) => s.assignCrew);
  const syncCrewSlots = useGameStore((s) => s.syncCrewSlots);

  const obs = observatoryLevel(stats.totalFocusSeconds);

  const researchOwned = (id: ResearchId) => {
    if (id === "efficient_harvest") return research.efficientHarvest;
    if (id === "resilient_core") return research.resilientCore;
    return research.calmSignal;
  };

  const titles: Record<MetaTab, { title: string; sub: string }> = {
    research: {
      title: "Lab",
      sub: "Permanent tech for bigger rewards",
    },
    cosmetics: {
      title: "Looks",
      sub: `Cosmetics · Observatory Lv.${obs.level}`,
    },
    crew: {
      title: "Crew",
      sub: "Assign posts between focus sessions",
    },
    badges: {
      title: "Achievements",
      sub: "Unlocks from focus milestones",
    },
  };

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92dvh,100%)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.5rem] border border-white/10 bg-gradient-to-b from-slate-900/98 to-slate-950 shadow-[0_0_60px_rgba(0,0,0,0.5)] sm:max-h-[90vh] sm:rounded-[1.75rem]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="shrink-0 border-b border-white/8 px-4 pt-4 pb-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-300">
                <Icon
                  name={
                    tab === "crew"
                      ? "steady"
                      : tab === "badges"
                        ? "star"
                        : tab === "cosmetics"
                          ? "sparkles"
                          : "hub"
                  }
                  size={18}
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  {titles[tab].title}
                </h2>
                <p className="text-[11px] text-white/40">{titles[tab].sub}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
              aria-label="Close lab"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          <div className="mt-3 flex gap-1 overflow-x-auto rounded-2xl border border-white/8 bg-black/40 p-1">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTabChange(t.id)}
                  className={`flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition ${
                    active
                      ? "bg-white/12 text-white shadow-sm"
                      : "text-white/45 hover:bg-white/5 hover:text-white/75"
                  }`}
                >
                  <Icon name={t.icon} size={14} />
                  <span className="text-[9px] font-bold tracking-wide uppercase">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hud-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
          {tab === "research" && (
            <div className="space-y-2">
              {Object.values(RESEARCH).map((r) => {
                const owned = researchOwned(r.id);
                const can =
                  !owned &&
                  resources.crystals >= r.costCrystals &&
                  resources.energy >= r.costEnergy;
                return (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="flex items-center gap-2 font-bold text-white">
                          <Icon
                            name={r.icon}
                            size={16}
                            className="text-violet-300"
                          />
                          {r.name}
                        </p>
                        <p className="mt-0.5 text-xs text-white/50">
                          {r.description}
                        </p>
                      </div>
                      {owned ? (
                        <span className="shrink-0 text-xs font-bold text-emerald-400">
                          Owned
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!can}
                          onClick={() => buyResearch(r.id)}
                          className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold ${
                            can
                              ? "bg-violet-500 text-white"
                              : "bg-white/5 text-white/30"
                          }`}
                        >
                          <ResourceCost
                            crystals={r.costCrystals}
                            energy={r.costEnergy}
                            size={12}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "cosmetics" && (
            <div>
              <p className="mb-2 text-[10px] font-semibold text-white/40 uppercase">
                Core skin
              </p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {CORE_SKINS.map((c) => {
                  const ok = isCosmeticUnlocked(
                    c.unlock,
                    obs.level,
                    unlocked
                  );
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={!ok}
                      onClick={() => setCoreSkin(c.id)}
                      className={`rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                        coreSkin === c.id
                          ? "bg-sky-500 text-white"
                          : ok
                            ? "border border-white/15 text-white/70 hover:bg-white/10"
                            : "opacity-30"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
              <p className="mb-2 text-[10px] font-semibold text-white/40 uppercase">
                Sky
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SKY_SKINS.map((c) => {
                  const ok = isCosmeticUnlocked(
                    c.unlock,
                    obs.level,
                    unlocked
                  );
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={!ok}
                      onClick={() => setSkySkin(c.id)}
                      className={`rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                        skySkin === c.id
                          ? "bg-indigo-500 text-white"
                          : ok
                            ? "border border-white/15 text-white/70 hover:bg-white/10"
                            : "opacity-30"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "crew" && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] text-white/40">
                  {crew.length} / {crewSlotsForLevel(obs.level)} slots · Lv.
                  {obs.level} unlocks more (max 12)
                </p>
                <button
                  type="button"
                  onClick={() => syncCrewSlots()}
                  className="shrink-0 text-[10px] font-semibold text-sky-400/80 hover:text-sky-300"
                >
                  Refresh slots
                </button>
              </div>
              <p className="mb-3 text-[10px] leading-relaxed text-white/35">
                Tip: tap crew walking on the island to assign posts quickly.
                New members arrive as your observatory levels up.
              </p>
              <div className="space-y-2">
                {crew.map((c) => {
                  const role = CREW_ROLES[c.role] ?? CREW_ROLES.worker;
                  const assigned = buildings.find(
                    (b) => b.id === c.assignedBuildingId
                  );
                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/30"
                          style={{ color: role.hue }}
                        >
                          <Icon name={role.icon} size={14} />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {c.name}{" "}
                            <span className="text-white/40">
                              · {role.name}
                            </span>
                          </p>
                          <p className="text-[10px] text-white/45">
                            {role.description}
                          </p>
                        </div>
                      </div>
                      <label className="block text-[10px] font-semibold tracking-wide text-white/35 uppercase">
                        Post
                        <select
                          value={c.assignedBuildingId ?? ""}
                          onChange={(e) =>
                            assignCrew(
                              c.id,
                              e.target.value === "" ? null : e.target.value
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs font-medium text-white outline-none focus:border-sky-400/40"
                        >
                          <option value="">Free roam</option>
                          {buildings.map((b) => (
                            <option key={b.id} value={b.id}>
                              {BUILDINGS[b.type].name} Lv.{b.level}
                            </option>
                          ))}
                        </select>
                      </label>
                      {assigned && (
                        <p className="mt-1.5 text-[10px] text-emerald-400/70">
                          On duty at {BUILDINGS[assigned.type].name}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "badges" && (
            <div>
              <p className="mb-3 text-[11px] text-white/40">
                {unlocked.length} / {ACHIEVEMENTS.length} unlocked
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ACHIEVEMENTS.map((a) => {
                  const done = unlocked.includes(a.id);
                  return (
                    <div
                      key={a.id}
                      className={`rounded-xl border p-2 text-xs ${
                        done
                          ? "border-amber-400/30 bg-amber-500/10"
                          : "border-white/10 bg-white/[0.03] opacity-50"
                      }`}
                    >
                      <p className="flex items-center gap-1.5 font-bold text-white">
                        <Icon
                          name={a.icon}
                          size={14}
                          className={
                            done ? "text-amber-300" : "text-white/40"
                          }
                        />
                        {a.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/45">
                        {a.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/8 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
