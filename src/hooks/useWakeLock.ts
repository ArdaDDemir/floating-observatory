"use client";

import { useEffect, useRef } from "react";

type WakeLockSentinel = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", fn: () => void) => void;
};

/**
 * Keep the screen awake while `active` (e.g. focus session running).
 * Requires a user gesture origin in some browsers; re-acquires on visibility.
 */
export function useWakeLock(active: boolean, enabled: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !active || typeof navigator === "undefined") {
      void lockRef.current?.release().catch(() => {});
      lockRef.current = null;
      return;
    }

    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
    };
    if (!nav.wakeLock?.request) return;

    let cancelled = false;

    const acquire = async () => {
      try {
        if (document.visibilityState !== "visible") return;
        const lock = await nav.wakeLock!.request("screen");
        if (cancelled) {
          await lock.release();
          return;
        }
        lockRef.current = lock;
        lock.addEventListener("release", () => {
          if (lockRef.current === lock) lockRef.current = null;
        });
      } catch {
        /* denied / unsupported */
      }
    };

    void acquire();

    const onVis = () => {
      if (document.visibilityState === "visible" && enabled && active) {
        void acquire();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [active, enabled]);
}
