"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import {
  observatoryLevel,
  streakRewardMultiplier,
  SESSION_TAGS,
} from "@/lib/meta";
import { Icon } from "@/components/icons";
import type { IconName } from "@/lib/iconNames";

function formatFocusHours(totalSeconds: number) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: IconName;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black/30 ${color}`}
        >
          <Icon name={icon} size={14} />
        </span>
        <span className="text-[10px] font-semibold tracking-wide text-white/40 uppercase">
          {label}
        </span>
      </div>
      <p className={`font-mono text-2xl font-black tracking-tight ${color}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-white/35">{sub}</p>}
    </div>
  );
}

export default function StatsPanel({ onClose }: { onClose: () => void }) {
  const stats = useGameStore((s) => s.stats);
  const placed = useGameStore((s) => s.placedBuildings);
  const unlocked = useGameStore((s) => s.unlockedAchievements);
  const research = useGameStore((s) => s.research);
  const sessionLog = useGameStore((s) => s.sessionLog);

  const obs = observatoryLevel(stats.totalFocusSeconds);
  const streakMult = streakRewardMultiplier(stats.currentStreak);
  const goalSec = Math.max(1, stats.dailyGoalMinutes * 60);
  const dailyPct = Math.min(100, (stats.dailyFocusSeconds / goalSec) * 100);
  const successRate =
    stats.sessionsCompleted + stats.sessionsFailed > 0
      ? Math.round(
          (stats.sessionsCompleted /
            (stats.sessionsCompleted + stats.sessionsFailed)) *
            100
        )
      : 100;

  const researchOwned = [
    research.efficientHarvest,
    research.resilientCore,
    research.calmSignal,
  ].filter(Boolean).length;

  const tagEntries = SESSION_TAGS.map((t) => ({
    ...t,
    seconds: stats.focusByTag?.[t.id] ?? 0,
  })).sort((a, b) => b.seconds - a.seconds);

  const maxTag = Math.max(1, ...tagEntries.map((t) => t.seconds));

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className="max-h-[min(70dvh,28rem)] w-[min(100vw-1.5rem,22rem)] overflow-y-auto hud-scroll rounded-[1.5rem] border border-white/12 bg-gradient-to-b from-slate-900/95 to-black/90 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
    >
      {/* Header */}
      <div className="relative border-b border-white/8 px-4 pt-4 pb-3">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-violet-500/15 to-transparent" />
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
              <Icon name="stats" size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-violet-300/70 uppercase">
                Observatory log
              </p>
              <h3 className="text-base font-bold text-white">Your stats</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-1.5 text-white/35 transition hover:bg-white/5 hover:text-white"
            aria-label="Close stats"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
        <p className="relative mt-2 text-[11px] text-white/35">
          Lifetime progress for this browser save.
        </p>
      </div>

      <div className="max-h-[min(70vh,28rem)] space-y-3 overflow-y-auto p-4">
        {/* Hero metrics */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon="timer"
            label="Total focus"
            value={formatFocusHours(stats.totalFocusSeconds)}
            sub="all-time"
            color="text-sky-300"
          />
          <StatCard
            icon="flame"
            label="Day streak"
            value={`${stats.currentStreak}d`}
            sub={
              streakMult > 1
                ? `${streakMult.toFixed(2)}x reward`
                : `best ${stats.longestStreak}d`
            }
            color="text-amber-300"
          />
          <StatCard
            icon="star"
            label="Completed"
            value={stats.sessionsCompleted}
            sub={`${successRate}% finish rate`}
            color="text-emerald-300"
          />
          <StatCard
            icon="swords"
            label="Abandoned"
            value={stats.sessionsFailed}
            sub={
              stats.failStreak > 0
                ? `fail streak ${stats.failStreak}`
                : "clean run ready"
            }
            color="text-rose-300"
          />
        </div>

        {/* Daily goal */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-white/50">
              <Icon name="target" size={12} className="text-emerald-400" />
              Today&apos;s goal
            </span>
            <span className="font-mono text-white/60">
              {Math.floor(stats.dailyFocusSeconds / 60)}/
              {stats.dailyGoalMinutes}m
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400"
              initial={{ width: 0 }}
              animate={{ width: `${dailyPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-white/30">
            {dailyPct >= 100
              ? "Daily quota met — streak can advance."
              : `${Math.max(0, stats.dailyGoalMinutes - Math.floor(stats.dailyFocusSeconds / 60))}m left to hit the goal.`}
          </p>
        </div>

        {/* Observatory level */}
        <div className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-200/70">
              <Icon name="orbit" size={12} />
              Observatory
            </span>
            <span className="font-mono text-sm font-black text-violet-200">
              Lv.{obs.level}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-400"
              style={{ width: `${obs.progress * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-white/30">
            {Math.round(obs.intoMinutes)} / {obs.nextMinutes} min into next level
          </p>
        </div>

        {/* Collection snapshot */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-2 py-2.5 text-center">
            <Icon
              name="building"
              size={14}
              className="mx-auto mb-1 text-sky-300/80"
            />
            <p className="font-mono text-lg font-bold text-white">
              {placed.length}
            </p>
            <p className="text-[9px] text-white/35">Structures</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-2 py-2.5 text-center">
            <Icon
              name="star"
              size={14}
              className="mx-auto mb-1 text-amber-300/80"
            />
            <p className="font-mono text-lg font-bold text-white">
              {unlocked.length}
            </p>
            <p className="text-[9px] text-white/35">Badges</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-2 py-2.5 text-center">
            <Icon
              name="hub"
              size={14}
              className="mx-auto mb-1 text-violet-300/80"
            />
            <p className="font-mono text-lg font-bold text-white">
              {researchOwned}/3
            </p>
            <p className="text-[9px] text-white/35">Research</p>
          </div>
        </div>

        {/* Focus by tag */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="mb-2.5 text-[10px] font-bold tracking-[0.14em] text-white/40 uppercase">
            Focus by intent
          </p>
          <div className="space-y-2">
            {tagEntries.map((t) => (
              <div key={t.id}>
                <div className="mb-0.5 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-white/60">
                    <Icon name={t.icon} size={11} className="text-white/40" />
                    {t.label}
                  </span>
                  <span className="font-mono text-white/45">
                    {formatFocusHours(t.seconds)}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500/80 to-violet-400/80"
                    style={{
                      width: `${(t.seconds / maxTag) * 100}%`,
                      minWidth: t.seconds > 0 ? 4 : 0,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session journal */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="mb-2.5 text-[10px] font-bold tracking-[0.14em] text-white/40 uppercase">
            Recent sessions
          </p>
          {sessionLog.length === 0 ? (
            <p className="text-[11px] text-white/35">
              No sessions logged yet. Finish or abandon one to fill the journal.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {sessionLog.slice(0, 8).map((e) => {
                const tag = SESSION_TAGS.find((t) => t.id === e.tag);
                const ok = e.outcome === "complete";
                return (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/6 bg-black/25 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-white/80">
                        {e.name}
                      </p>
                      <p className="flex items-center gap-1 text-[9px] text-white/35">
                        {tag && <Icon name={tag.icon} size={9} />}
                        {tag?.label ?? e.tag}
                        <span>·</span>
                        {Math.round(e.durationSeconds / 60) || 0}m
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-[10px] font-bold ${
                          ok ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {ok ? "Done" : "Fail"}
                      </p>
                      <p className="font-mono text-[9px] text-white/40">
                        {ok ? "+" : ""}
                        {e.crystals}/{e.energy}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
