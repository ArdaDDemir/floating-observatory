"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { Icon } from "@/components/icons";
import type { IconName } from "@/lib/iconNames";

const STEPS: {
  eyebrow: string;
  title: string;
  body: string;
  visual: IconName;
}[] = [
  {
    eyebrow: "01  Welcome",
    title: "Your Floating Observatory",
    body: "This island grows when you focus. Daily streaks, research, and cosmetics reward consistency — not mid-session clicks.",
    visual: "island",
  },
  {
    eyebrow: "02  Focus Loop",
    title: "Duration, tag, pause, break.",
    body: "Pick how long and what you're doing. Pause anytime. Finish for loot; take an optional break. Ambient events auto-fade. Give up costs resources.",
    visual: "timer",
  },
  {
    eyebrow: "03  Build & Meta",
    title: "Structures, research, achievements.",
    body: "Build shields and dishes, upgrade towers, unlock research in Meta. Hit your daily goal to grow your streak bonus.",
    visual: "build",
  },
];

export default function Onboarding() {
  const hasSeenOnboarding = useGameStore((s) => s.hasSeenOnboarding);
  const dismissOnboarding = useGameStore((s) => s.dismissOnboarding);
  const hasHydrated = useGameStore((s) => s._hasHydrated);
  const [step, setStep] = useState(0);

  if (!hasHydrated || hasSeenOnboarding) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-end justify-center bg-[#020617]/80 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-h-[min(92dvh,100%)] w-full max-w-lg overflow-y-auto hud-scroll rounded-t-3xl border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 shadow-[0_0_80px_rgba(59,130,246,0.15)] sm:rounded-3xl"
      >
        <div className="border-b border-white/5 bg-white/[0.03] px-6 py-4">
          <p className="text-xs font-semibold tracking-[0.2em] text-sky-400/80 uppercase">
            Observatory Primer
          </p>
        </div>

        <div className="px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-300 shadow-inner">
                <Icon name={current.visual} size={36} strokeWidth={1.5} />
              </div>
              <p className="mb-2 text-[11px] font-bold tracking-[0.18em] text-emerald-400/90 uppercase">
                {current.eyebrow}
              </p>
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-white">
                {current.title}
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-white/60">
                {current.body}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Step ${i + 1}`}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-6 bg-sky-400"
                    : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/5 px-6 py-4">
          <button
            type="button"
            onClick={dismissOnboarding}
            className="text-xs font-medium text-white/40 transition hover:text-white/70"
          >
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/5"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLast) dismissOnboarding();
                else setStep((s) => s + 1);
              }}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.35)] transition hover:brightness-110 active:scale-[0.98]"
            >
              {isLast ? "Enter Observatory" : "Next"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
