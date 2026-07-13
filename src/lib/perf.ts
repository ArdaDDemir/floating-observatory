/** Shared performance helpers for 3D / motion */

export type GraphicsQuality = "auto" | "low" | "high";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function isNarrowViewport(maxWidth = 768): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(max-width: ${maxWidth - 1}px)`).matches;
}

/** Mobile-class device: touch-first or narrow screen */
export function isMobileDevice(): boolean {
  return isCoarsePointer() || isNarrowViewport();
}

/** Sync battery heuristic when getBattery unavailable */
export function isBatteryLowSync(): boolean {
  return false;
}

export type GraphicsProfile = {
  tier: "low" | "high";
  shadows: boolean;
  dprMax: number;
  antialias: boolean;
  sparkleScale: number;
  bloomIntensity: number;
  multisampling: number;
  breakFx: boolean;
  powerPreference: "low-power" | "high-performance";
};

/**
 * Resolve effective graphics from user pref + device capabilities.
 * auto → low on mobile / reduced-motion / low battery / weak CPU
 */
export function resolveGraphicsProfile(
  quality: GraphicsQuality = "auto",
  opts?: { batteryLow?: boolean }
): GraphicsProfile {
  const motionOff = prefersReducedMotion();
  const mobile = isMobileDevice();
  const weakCpu = (navigator.hardwareConcurrency ?? 4) <= 4;
  const batteryLow = Boolean(opts?.batteryLow);

  let tier: "low" | "high" = "high";
  if (quality === "low") tier = "low";
  else if (quality === "high") tier = motionOff ? "low" : "high";
  else {
    // auto
    if (motionOff || mobile || batteryLow || weakCpu) tier = "low";
    else tier = "high";
  }

  if (tier === "low") {
    return {
      tier: "low",
      shadows: false,
      dprMax: 1,
      antialias: false,
      sparkleScale: motionOff ? 0.25 : mobile ? 0.35 : 0.45,
      bloomIntensity: 0.55,
      multisampling: 0,
      breakFx: !motionOff && !mobile,
      powerPreference: "low-power",
    };
  }

  return {
    tier: "high",
    shadows: !motionOff,
    dprMax: 1.5,
    antialias: true,
    sparkleScale: motionOff ? 0.35 : 1,
    bloomIntensity: 1,
    multisampling: 4,
    breakFx: !motionOff,
    powerPreference: "high-performance",
  };
}

/** Cap effect density on weaker / mobile devices */
export function effectScale(profile?: GraphicsProfile): number {
  if (typeof window === "undefined") return 1;
  if (profile) return profile.sparkleScale;
  return resolveGraphicsProfile("auto").sparkleScale;
}

export function sparkleCount(
  base: number,
  profile?: GraphicsProfile
): number {
  return Math.max(6, Math.round(base * effectScale(profile)));
}

/** @deprecated use resolveGraphicsProfile — kept for call sites */
export function enableShadows(): boolean {
  return resolveGraphicsProfile("auto").shadows;
}
