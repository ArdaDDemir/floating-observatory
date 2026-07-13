/**
 * Procedural Web Audio library — no sample files / no third-party assets.
 * Royalty-free by design (generated at runtime).
 */

let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Call from first user gesture so browsers allow audio. */
export function unlockAudio() {
  const c = getCtx();
  if (!c) return;
  void c.resume().then(() => {
    unlocked = true;
  });
}

function ensurePlaying(enabled: boolean) {
  if (!enabled) return null;
  const c = getCtx();
  if (!c) return null;
  if (c.state === "suspended") void c.resume();
  unlocked = true;
  return c;
}

function tone(
  c: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType,
  gain = 0.04,
  when = 0,
  freqEnd?: number
) {
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, freqEnd),
      t0 + duration
    );
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

function chord(
  c: AudioContext,
  freqs: number[],
  duration: number,
  type: OscillatorType,
  gain: number,
  when = 0
) {
  for (const f of freqs) {
    tone(c, f, duration, type, gain / freqs.length, when);
  }
}

function noiseBurst(
  c: AudioContext,
  duration: number,
  gain: number,
  when = 0,
  filterFreq = 1200,
  type: BiquadFilterType = "lowpass"
) {
  const t0 = c.currentTime + when;
  const n = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, n, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(filterFreq, t0);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

// ─── Session ───────────────────────────────────────────────

export function playStartSession(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  noiseBurst(c, 0.06, 0.015, 0, 2000, "highpass");
  tone(c, 261.63, 0.1, "sine", 0.03, 0);
  tone(c, 329.63, 0.12, "sine", 0.032, 0.08);
  tone(c, 392.0, 0.14, "triangle", 0.03, 0.16);
  tone(c, 523.25, 0.22, "sine", 0.035, 0.26);
  tone(c, 659.25, 0.28, "triangle", 0.022, 0.36);
}

export function playPause(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 440, 0.1, "sine", 0.03, 0, 330);
  tone(c, 330, 0.14, "triangle", 0.025, 0.08, 220);
  noiseBurst(c, 0.05, 0.012, 0.02, 800);
}

export function playResume(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 330, 0.08, "sine", 0.028, 0, 440);
  tone(c, 440, 0.1, "triangle", 0.025, 0.07, 554);
  tone(c, 554, 0.12, "sine", 0.02, 0.14);
}

export function playCompleteChime(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  // Rising fanfare
  chord(c, [523.25, 659.25], 0.18, "sine", 0.05, 0);
  chord(c, [587.33, 739.99], 0.18, "sine", 0.045, 0.14);
  chord(c, [659.25, 830.61, 1046.5], 0.35, "triangle", 0.05, 0.28);
  tone(c, 1318.5, 0.25, "sine", 0.018, 0.4);
  noiseBurst(c, 0.12, 0.012, 0.32, 3000, "highpass");
}

export function playDailyGoal(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 392, 0.12, "sine", 0.035, 0);
  tone(c, 523.25, 0.12, "sine", 0.032, 0.1);
  tone(c, 659.25, 0.12, "sine", 0.03, 0.2);
  tone(c, 783.99, 0.14, "triangle", 0.028, 0.3);
  tone(c, 1046.5, 0.35, "sine", 0.04, 0.42);
  tone(c, 1318.5, 0.3, "triangle", 0.02, 0.5);
}

export function playFailThud(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  noiseBurst(c, 0.25, 0.04, 0, 350);
  tone(c, 110, 0.4, "sine", 0.06, 0, 48);
  tone(c, 82, 0.45, "triangle", 0.04, 0.05, 40);
  tone(c, 55, 0.35, "sine", 0.03, 0.1);
  noiseBurst(c, 0.15, 0.02, 0.12, 180);
}

export function playLockout(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 200, 0.15, "square", 0.012, 0);
  tone(c, 160, 0.2, "square", 0.01, 0.12);
  tone(c, 120, 0.25, "triangle", 0.015, 0.22);
}

// ─── Ambient / focus ───────────────────────────────────────

export function playEventTick(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 880, 0.06, "triangle", 0.02, 0);
  tone(c, 1174, 0.08, "sine", 0.016, 0.04);
  tone(c, 1568, 0.1, "sine", 0.01, 0.08);
  noiseBurst(c, 0.05, 0.008, 0.02, 4000, "highpass");
}

export function playEventFlavor(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 740, 0.12, "sine", 0.015, 0, 990);
  tone(c, 990, 0.14, "triangle", 0.012, 0.08);
}

export function playMinuteTick(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  // Soft, unobtrusive — one soft blip per focus minute
  tone(c, 660, 0.04, "sine", 0.012, 0);
  tone(c, 880, 0.05, "triangle", 0.008, 0.03);
}

export function playHalfway(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 523.25, 0.1, "sine", 0.025, 0);
  tone(c, 659.25, 0.14, "triangle", 0.022, 0.1);
}

export function playFinalStretch(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 587, 0.08, "sine", 0.025, 0);
  tone(c, 740, 0.08, "sine", 0.022, 0.07);
  tone(c, 880, 0.12, "triangle", 0.02, 0.14);
}

// ─── Break ─────────────────────────────────────────────────

export function playBreakStart(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 392, 0.2, "sine", 0.028, 0, 523);
  tone(c, 494, 0.25, "triangle", 0.025, 0.12, 659);
  tone(c, 587, 0.3, "sine", 0.02, 0.24);
  noiseBurst(c, 0.2, 0.01, 0.1, 1500);
}

export function playBreakEnd(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 523, 0.1, "sine", 0.025, 0);
  tone(c, 392, 0.16, "triangle", 0.022, 0.1);
}

// ─── Build / island ────────────────────────────────────────

export function playPlaceBuilding(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  noiseBurst(c, 0.07, 0.028, 0, 1100);
  tone(c, 180, 0.1, "triangle", 0.035, 0.01, 280);
  tone(c, 360, 0.12, "sine", 0.028, 0.07);
  tone(c, 540, 0.1, "triangle", 0.018, 0.14);
  noiseBurst(c, 0.06, 0.015, 0.1, 2200, "highpass");
}

export function playUpgrade(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 392, 0.08, "sine", 0.028, 0);
  tone(c, 494, 0.09, "sine", 0.028, 0.07);
  tone(c, 587, 0.1, "triangle", 0.026, 0.14);
  tone(c, 740, 0.12, "sine", 0.024, 0.22);
  tone(c, 988, 0.18, "triangle", 0.02, 0.3);
  noiseBurst(c, 0.08, 0.012, 0.28, 3500, "highpass");
}

export function playDestroy(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  noiseBurst(c, 0.18, 0.04, 0, 700);
  tone(c, 220, 0.15, "sawtooth", 0.018, 0, 90);
  tone(c, 140, 0.22, "triangle", 0.03, 0.05, 60);
  noiseBurst(c, 0.2, 0.03, 0.08, 400);
}

export function playRelocate(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 300, 0.08, "sine", 0.022, 0, 450);
  tone(c, 450, 0.1, "triangle", 0.02, 0.08, 300);
  noiseBurst(c, 0.06, 0.015, 0.04, 1200);
}

export function playBuildModeOn(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 349, 0.08, "triangle", 0.022, 0);
  tone(c, 440, 0.1, "sine", 0.02, 0.06);
  tone(c, 523, 0.12, "triangle", 0.018, 0.12);
}

export function playBuildModeOff(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 523, 0.07, "sine", 0.018, 0, 349);
  tone(c, 349, 0.1, "triangle", 0.015, 0.06);
}

// ─── Crew ──────────────────────────────────────────────────

export function playAssignCrew(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 494, 0.08, "sine", 0.028, 0);
  tone(c, 622, 0.1, "triangle", 0.025, 0.07);
  tone(c, 784, 0.14, "sine", 0.022, 0.14);
}

export function playRecruit(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 330, 0.1, "sine", 0.028, 0);
  tone(c, 415, 0.1, "sine", 0.026, 0.09);
  tone(c, 494, 0.12, "triangle", 0.024, 0.18);
  tone(c, 622, 0.14, "sine", 0.022, 0.28);
  tone(c, 740, 0.22, "triangle", 0.02, 0.38);
  noiseBurst(c, 0.1, 0.01, 0.35, 2800, "highpass");
}

export function playSelectNpc(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 700, 0.05, "sine", 0.02, 0);
  tone(c, 940, 0.08, "triangle", 0.016, 0.04);
}

// ─── Meta / UI ─────────────────────────────────────────────

export function playUiClick(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 620, 0.035, "triangle", 0.016, 0);
  tone(c, 880, 0.04, "sine", 0.01, 0.02);
}

export function playUiTap(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 740, 0.03, "sine", 0.014, 0);
}

export function playSelect(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 520, 0.05, "triangle", 0.02, 0);
  tone(c, 780, 0.07, "sine", 0.015, 0.03);
}

export function playDeselect(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 480, 0.05, "sine", 0.014, 0, 320);
}

export function playPanelOpen(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 280, 0.08, "sine", 0.02, 0, 420);
  tone(c, 420, 0.1, "triangle", 0.016, 0.05);
  noiseBurst(c, 0.05, 0.008, 0, 1800);
}

export function playPanelClose(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 400, 0.07, "sine", 0.016, 0, 260);
}

export function playResearch(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 440, 0.1, "sine", 0.03, 0);
  tone(c, 554, 0.12, "triangle", 0.028, 0.1);
  tone(c, 659, 0.14, "sine", 0.025, 0.2);
  tone(c, 880, 0.2, "triangle", 0.022, 0.32);
  noiseBurst(c, 0.1, 0.012, 0.28, 3200, "highpass");
}

export function playAchievement(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 523, 0.1, "sine", 0.03, 0);
  tone(c, 659, 0.1, "sine", 0.028, 0.1);
  tone(c, 784, 0.12, "triangle", 0.026, 0.2);
  tone(c, 1047, 0.28, "sine", 0.03, 0.32);
  tone(c, 1319, 0.2, "triangle", 0.015, 0.42);
}

export function playError(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 180, 0.1, "square", 0.012, 0);
  tone(c, 140, 0.14, "square", 0.01, 0.08);
}

export function playToggle(enabled: boolean, on: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  if (on) {
    tone(c, 400, 0.05, "sine", 0.018, 0, 600);
    tone(c, 600, 0.06, "triangle", 0.014, 0.04);
  } else {
    tone(c, 500, 0.05, "sine", 0.016, 0, 320);
  }
}

export function playMeteor(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  noiseBurst(c, 0.4, 0.05, 0, 600);
  tone(c, 90, 0.5, "sawtooth", 0.025, 0, 40);
  tone(c, 60, 0.55, "sine", 0.04, 0.05);
  noiseBurst(c, 0.3, 0.04, 0.15, 300);
  tone(c, 40, 0.4, "triangle", 0.03, 0.2);
}

export function playExport(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 520, 0.06, "sine", 0.02, 0);
  tone(c, 660, 0.08, "triangle", 0.018, 0.05);
  tone(c, 780, 0.1, "sine", 0.015, 0.1);
}

export function playImportOk(enabled: boolean) {
  const c = ensurePlaying(enabled);
  if (!c) return;
  tone(c, 440, 0.08, "sine", 0.025, 0);
  tone(c, 554, 0.1, "sine", 0.022, 0.08);
  tone(c, 659, 0.16, "triangle", 0.02, 0.16);
}

export function isAudioUnlocked() {
  return unlocked;
}

/** Convenience: current store sound flag is passed by callers */
export function sfx(
  enabled: boolean,
  fn: (on: boolean) => void
) {
  fn(enabled);
}
