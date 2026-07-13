"use client";

import { useGameStore } from "@/store/useGameStore";
import {
  observatoryLevel,
  streakRewardMultiplier,
} from "@/lib/meta";
import { Icon } from "@/components/icons";

export default function DailyStrip() {
  const stats = useGameStore((s) => s.stats);
  const goalSec = stats.dailyGoalMinutes * 60;
  const progress = Math.min(1, stats.dailyFocusSeconds / Math.max(1, goalSec));
  const obs = observatoryLevel(stats.totalFocusSeconds);
  const streakMult = streakRewardMultiplier(stats.currentStreak);

  return (
    <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/10 bg-black/45 p-3 shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-bold tracking-wider text-amber-300/90 uppercase">
          <Icon name="flame" size={13} className="text-amber-400" />
          {stats.currentStreak}d streak
          {streakMult > 1 && (
            <span className="ml-0.5 text-emerald-400">
              {streakMult.toFixed(2)}x
            </span>
          )}
        </span>
        <span className="inline-flex items-center gap-1 font-mono text-white/50">
          <Icon name="orbit" size={12} />
          Lv.{obs.level}
        </span>
      </div>
      <div className="mb-1 flex justify-between text-[10px] text-white/45">
        <span>Daily goal</span>
        <span className="font-mono">
          {Math.floor(stats.dailyFocusSeconds / 60)}/{stats.dailyGoalMinutes}m
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-violet-400/80 transition-all"
          style={{ width: `${obs.progress * 100}%` }}
          title="Observatory XP"
        />
      </div>
      <p className="mt-1 text-[9px] text-white/30">
        Observatory progress — best streak {stats.longestStreak}d
      </p>
    </div>
  );
}
