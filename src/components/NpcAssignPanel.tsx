"use client";

import { useGameStore } from "@/store/useGameStore";
import { CREW_ROLES, normalizeCrewList } from "@/lib/crew";
import { BUILDINGS } from "@/lib/gameConfig";
import { Icon } from "@/components/icons";
import { motion } from "framer-motion";

/** Island-click panel: assign a crew NPC to a building post */
export default function NpcAssignPanel() {
  const selectedCrewId = useGameStore((s) => s.selectedCrewId);
  const crewRaw = useGameStore((s) => s.crew);
  const buildings = useGameStore((s) => s.placedBuildings);
  const assignCrew = useGameStore((s) => s.assignCrew);
  const selectCrewId = useGameStore((s) => s.selectCrewId);
  const status = useGameStore((s) => s.status);

  const crew = normalizeCrewList(crewRaw);
  const member = crew.find((c) => c.id === selectedCrewId);
  if (!member) return null;
  if (status === "running" || status === "paused" || status === "break") {
    return null;
  }

  const role = CREW_ROLES[member.role];
  const assigned = buildings.find((b) => b.id === member.assignedBuildingId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="pointer-events-auto w-full max-w-sm rounded-3xl border border-sky-400/30 bg-black/75 p-4 shadow-2xl backdrop-blur-xl"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15"
            style={{ background: `${role.hue}22`, color: role.hue }}
          >
            <Icon name={role.icon} size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-sky-300/80 uppercase">
              Crew · tap island NPC
            </p>
            <h3 className="text-lg font-bold text-white">
              {member.name}{" "}
              <span className="text-sm font-semibold text-white/45">
                · {role.name}
              </span>
            </h3>
            <p className="text-[11px] text-white/50">{role.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => selectCrewId(null)}
          className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <Icon name="close" size={14} />
        </button>
      </div>

      {assigned && (
        <p className="mb-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-center text-[11px] text-emerald-300/90">
          On duty · {BUILDINGS[assigned.type].name} Lv.{assigned.level}
        </p>
      )}

      <p className="mb-2 text-[10px] font-bold tracking-wider text-white/40 uppercase">
        Assign post
      </p>
      <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto hud-scroll">
        <button
          type="button"
          onClick={() => assignCrew(member.id, null)}
          className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition touch-manipulation ${
            !member.assignedBuildingId
              ? "border-sky-400/40 bg-sky-500/20 text-sky-100"
              : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          Free roam
        </button>
        {buildings.length === 0 && (
          <p className="px-1 text-[11px] text-white/40">
            Place a building first, then assign {member.name} to it.
          </p>
        )}
        {buildings.map((b) => {
          const def = BUILDINGS[b.type];
          const preferred = role.prefers.includes(b.type);
          const active = member.assignedBuildingId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => assignCrew(member.id, b.id)}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition touch-manipulation ${
                active
                  ? "border-sky-400/40 bg-sky-500/20 text-sky-100"
                  : preferred
                    ? "border-emerald-400/25 bg-emerald-500/10 text-white/85 hover:bg-emerald-500/15"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Icon name={def.icon} size={14} />
                {def.name}{" "}
                <span className="text-white/40">Lv.{b.level}</span>
              </span>
              {preferred && (
                <span className="text-[9px] font-bold text-emerald-400/80 uppercase">
                  Fits
                </span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
