"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";

export function useGameHotkeys(
  onOpenMeta: () => void,
  onCloseOverlays: () => void
) {
  const status = useGameStore((s) => s.status);
  const pauseQuest = useGameStore((s) => s.pauseQuest);
  const resumeQuest = useGameStore((s) => s.resumeQuest);
  const toggleBuildMode = useGameStore((s) => s.toggleBuildMode);
  const clearBuildSelection = useGameStore((s) => s.clearBuildSelection);
  const buildMode = useGameStore((s) => s.buildMode);
  const setPrefs = useGameStore((s) => s.setPrefs);
  const zenMode = useGameStore((s) => s.prefs.zenMode);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (buildMode) {
          clearBuildSelection();
        }
        onCloseOverlays();
        return;
      }

      if (e.code === "Space") {
        if (status === "running") {
          e.preventDefault();
          pauseQuest();
        } else if (status === "paused") {
          e.preventDefault();
          resumeQuest();
        }
        return;
      }

      if (e.key === "b" || e.key === "B") {
        if (status === "idle" || status === "completed" || status === "failed") {
          toggleBuildMode();
        }
        return;
      }

      if (e.key === "m" || e.key === "M") {
        onOpenMeta();
        return;
      }

      if (e.key === "z" || e.key === "Z") {
        setPrefs({ zenMode: !zenMode });
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    status,
    pauseQuest,
    resumeQuest,
    toggleBuildMode,
    clearBuildSelection,
    buildMode,
    setPrefs,
    zenMode,
    onOpenMeta,
    onCloseOverlays,
  ]);
}
