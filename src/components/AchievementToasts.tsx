"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { Icon } from "@/components/icons";
import type { IconName } from "@/lib/iconNames";

/** Bottom-right stack — away from quest panel (left) and build bar (center) */
export default function AchievementToasts() {
  const toasts = useGameStore((s) => s.achievementToasts);
  const dismiss = useGameStore((s) => s.dismissAchievementToast);

  return (
    <div className="pointer-events-none absolute right-4 bottom-28 z-30 flex w-[min(100%,18rem)] flex-col-reverse gap-2 sm:right-6 sm:bottom-32">
      <AnimatePresence>
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDone={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({
  id,
  name,
  icon,
  onDone,
}: {
  id: string;
  name: string;
  icon: IconName;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 4500);
    return () => window.clearTimeout(t);
  }, [id, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, x: 12 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 8, x: 8 }}
      className="rounded-2xl border border-amber-400/35 bg-black/80 px-3 py-2.5 shadow-[0_0_24px_rgba(251,191,36,0.12)] backdrop-blur-xl"
    >
      <p className="text-[10px] font-bold tracking-wider text-amber-300/80 uppercase">
        Achievement unlocked
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-300">
          <Icon name={icon} size={14} />
        </span>
        {name}
      </p>
    </motion.div>
  );
}
