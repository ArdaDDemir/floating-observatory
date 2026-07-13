"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { EVENT_TOAST_MS } from "@/lib/events";
import { Icon, ResourceCost } from "@/components/icons";
import type { IconName } from "@/lib/iconNames";

/**
 * Non-blocking ambient event feedback.
 * pointer-events-none so the player never has to interact.
 */
export default function EventToasts() {
  const toasts = useGameStore((s) => s.eventToasts);
  const dismissEventToast = useGameStore((s) => s.dismissEventToast);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute top-20 right-2 z-30 flex w-[min(calc(100vw-1rem),18rem)] flex-col gap-2 sm:top-28 sm:right-6 sm:w-[min(100%,20rem)]"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem
            key={t.instanceId}
            instanceId={t.instanceId}
            icon={t.icon}
            title={t.title}
            body={t.body}
            crystals={t.crystals}
            energy={t.energy}
            kind={t.kind}
            onDone={() => dismissEventToast(t.instanceId)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  instanceId,
  icon,
  title,
  body,
  crystals,
  energy,
  kind,
  onDone,
}: {
  instanceId: string;
  icon: IconName;
  title: string;
  body: string;
  crystals: number;
  energy: number;
  kind: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const id = window.setTimeout(onDone, EVENT_TOAST_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dismiss once per toast id
  }, [instanceId]);

  const border =
    kind === "milestone"
      ? "border-sky-400/35"
      : kind === "flavor"
        ? "border-white/15"
        : "border-emerald-400/30";

  const glow =
    kind === "milestone"
      ? "shadow-[0_0_24px_rgba(56,189,248,0.15)]"
      : kind === "reward"
        ? "shadow-[0_0_20px_rgba(16,185,129,0.12)]"
        : "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 28, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={`rounded-2xl border ${border} ${glow} bg-black/70 px-3.5 py-3 backdrop-blur-xl`}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sky-300">
          <Icon name={icon} size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-white/50">
            {body}
          </p>
          {(crystals > 0 || energy > 0) && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300/90">
              <span>+</span>
              <ResourceCost crystals={crystals} energy={energy} size={11} />
            </p>
          )}
        </div>
      </div>
      <motion.div
        className="mt-2.5 h-0.5 origin-left rounded-full bg-white/25"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: EVENT_TOAST_MS / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}
