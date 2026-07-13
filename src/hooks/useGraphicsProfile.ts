"use client";

import { useEffect, useState } from "react";
import {
  resolveGraphicsProfile,
  type GraphicsProfile,
  type GraphicsQuality,
} from "@/lib/perf";

/**
 * Reactive graphics profile from prefs + device (battery, mobile, motion).
 * Battery is optional — async subscribe only (no sync setState in effect).
 */
export function useGraphicsProfile(
  quality: GraphicsQuality
): GraphicsProfile {
  const [batteryLow, setBatteryLow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{
        level: number;
        charging: boolean;
        addEventListener: (t: string, fn: () => void) => void;
        removeEventListener: (t: string, fn: () => void) => void;
      }>;
    };

    if (!nav.getBattery) return;

    let bat: Awaited<ReturnType<NonNullable<typeof nav.getBattery>>> | null =
      null;
    const update = () => {
      if (cancelled || !bat) return;
      setBatteryLow(!bat.charging && bat.level > 0 && bat.level <= 0.2);
    };

    nav
      .getBattery()
      .then((b) => {
        if (cancelled) return;
        bat = b;
        update();
        b.addEventListener("levelchange", update);
        b.addEventListener("chargingchange", update);
      })
      .catch(() => {
        /* ignore */
      });

    return () => {
      cancelled = true;
      if (bat) {
        bat.removeEventListener("levelchange", update);
        bat.removeEventListener("chargingchange", update);
      }
    };
  }, []);

  return resolveGraphicsProfile(quality, { batteryLow });
}
