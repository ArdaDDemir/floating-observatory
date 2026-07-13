"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/icons";
import type { IconName } from "@/lib/iconNames";

const STEPS: {
  step: string;
  title: string;
  body: string;
  icon: IconName;
  tint: string;
  ring: string;
}[] = [
  {
    step: "01",
    title: "Focus",
    body: "Pick a duration and intent, then start. Pause with Space whenever life interrupts.",
    icon: "timer",
    tint: "from-emerald-500/20 to-emerald-500/5 text-emerald-300",
    ring: "border-emerald-400/30",
  },
  {
    step: "02",
    title: "Earn",
    body: "Finish the timer to harvest Crystals and Energy. Buildings, streak, and research multiply the haul.",
    icon: "crystal",
    tint: "from-sky-500/20 to-sky-500/5 text-sky-300",
    ring: "border-sky-400/30",
  },
  {
    step: "03",
    title: "Break",
    body: "After a win, take an optional rest. The island softens into a cinematic break mode.",
    icon: "wave",
    tint: "from-amber-500/20 to-amber-500/5 text-amber-300",
    ring: "border-amber-400/30",
  },
  {
    step: "04",
    title: "Build & Lab",
    body: "Place and upgrade structures on the island. Lab unlocks research, cosmetics, achievements, and save export.",
    icon: "build",
    tint: "from-violet-500/20 to-violet-500/5 text-violet-300",
    ring: "border-violet-400/30",
  },
  {
    step: "05",
    title: "Stay steady",
    body: "Giving up costs resources. Two abandons in a row lock new quests (5m → 15m → 30m → 1h).",
    icon: "shield",
    tint: "from-rose-500/20 to-rose-500/5 text-rose-300",
    ring: "border-rose-400/30",
  },
];

const TOOLS: { icon: IconName; name: string; blurb: string }[] = [
  { icon: "hub", name: "Lab", blurb: "Research, skins, badges, save" },
  { icon: "guide", name: "Guide", blurb: "This primer" },
  { icon: "stats", name: "Stats", blurb: "Lifetime focus log" },
  { icon: "zen", name: "Zen", blurb: "Timer only, less chrome" },
  { icon: "build", name: "Build", blurb: "Place & upgrade" },
];

export default function GuidePanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-[#020617]/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[min(92dvh,100%)] w-full max-w-lg overflow-hidden rounded-t-[1.5rem] border border-white/10 bg-gradient-to-b from-slate-900/98 via-slate-950/98 to-[#020617] shadow-[0_0_80px_rgba(56,189,248,0.12)] sm:max-h-[88vh] sm:rounded-[1.75rem]"
      >
        {/* Top glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-sky-500/15 to-transparent" />

        <div className="relative border-b border-white/5 px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-500/10 text-sky-300">
                <Icon name="guide" size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-sky-400/80 uppercase">
                  Field manual
                </p>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  How the Observatory works
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
              aria-label="Close guide"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            Real focus grows a floating island. Sessions pay resources; spam
            quitting does not.
          </p>
        </div>

        <div className="hud-scroll relative max-h-[min(52dvh,420px)] overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="space-y-2.5">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
                className={`flex gap-3 rounded-2xl border bg-gradient-to-r p-3 ${s.ring} ${s.tint.split(" ").slice(0, 2).join(" ")}`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border bg-black/30 ${s.ring}`}
                >
                  <Icon
                    name={s.icon}
                    size={18}
                    className={s.tint.split(" ").pop()}
                  />
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5 flex items-baseline gap-2">
                    <span className="font-mono text-[10px] font-bold text-white/30">
                      {s.step}
                    </span>
                    <h4 className="text-sm font-bold text-white">{s.title}</h4>
                  </div>
                  <p className="text-xs leading-relaxed text-white/55">
                    {s.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-white/35 uppercase">
              Toolbar
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {TOOLS.map((t) => (
                <div
                  key={t.name}
                  className="flex flex-col items-center gap-1 rounded-xl border border-white/8 bg-white/[0.03] px-1 py-2 text-center"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/70">
                    <Icon name={t.icon} size={14} />
                  </span>
                  <span className="text-[10px] font-bold text-white/80">
                    {t.name}
                  </span>
                  <span className="text-[8px] leading-tight text-white/35">
                    {t.blurb}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-center text-[10px] text-white/35">
            Keys: Space pause · B build · M lab · Z zen · Esc close
          </p>
        </div>

        <div className="relative border-t border-white/5 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-400 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.3)] transition hover:brightness-110 active:scale-[0.99]"
          >
            Got it — back to the island
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
