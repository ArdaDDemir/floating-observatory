/** Soft device vibration — no-op when unsupported or disabled */

export function haptic(
  enabled: boolean,
  pattern: number | number[] = 12
) {
  if (!enabled || typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

export function hapticComplete(enabled: boolean) {
  haptic(enabled, [18, 40, 24]);
}

export function hapticFail(enabled: boolean) {
  haptic(enabled, [40, 30, 60]);
}

export function hapticTick(enabled: boolean) {
  haptic(enabled, 8);
}
