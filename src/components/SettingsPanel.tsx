"use client";

import { useRef, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { downloadJson, readJsonFile } from "@/lib/save";
import { Icon } from "@/components/icons";
import {
  playToggle,
  playExport,
  playPanelClose,
  unlockAudio,
} from "@/lib/audio";

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const stats = useGameStore((s) => s.stats);
  const prefs = useGameStore((s) => s.prefs);
  const setPrefs = useGameStore((s) => s.setPrefs);
  const setDailyGoalMinutes = useGameStore((s) => s.setDailyGoalMinutes);
  const exportSave = useGameStore((s) => s.exportSave);
  const importSave = useGameStore((s) => s.importSave);
  const clearCheaterStrike = useGameStore((s) => s.clearCheaterStrike);
  const cheaterStrike = useGameStore((s) => s.cheaterStrike);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92dvh,100%)] w-full max-w-md flex-col overflow-hidden rounded-t-[1.5rem] border border-white/10 bg-gradient-to-b from-slate-900/98 to-slate-950 shadow-[0_0_60px_rgba(0,0,0,0.5)] sm:max-h-[90vh] sm:rounded-[1.75rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="shrink-0 border-b border-white/8 px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200">
                <Icon name="settings" size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Settings</h2>
                <p className="text-[11px] text-white/40">
                  Audio, goals, zen, sealed save
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playPanelClose(prefs.soundEnabled);
                onClose();
              }}
              className="rounded-xl border border-white/10 p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
              aria-label="Close settings"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>

        <div className="hud-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <section>
            <h3 className="mb-2 text-xs font-bold tracking-wider text-white/40 uppercase">
              Experience
            </h3>
            <div className="space-y-2 text-sm text-white/70">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <span>
                  <span className="block font-medium text-white/85">
                    Sound cues
                  </span>
                  <span className="text-[10px] text-white/35">
                    Procedural Web Audio (no sample packs / royalty-free)
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={prefs.soundEnabled}
                  onChange={(e) => {
                    unlockAudio();
                    const on = e.target.checked;
                    setPrefs({ soundEnabled: on });
                    // Preview even when turning off (uses true once)
                    playToggle(true, on);
                  }}
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <span>
                  <span className="block font-medium text-white/85">
                    Desktop notify
                  </span>
                  <span className="text-[10px] text-white/35">
                    Alert when tab is hidden
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={prefs.notifyEnabled}
                  onChange={async (e) => {
                    const on = e.target.checked;
                    if (on && "Notification" in window) {
                      await Notification.requestPermission();
                    }
                    setPrefs({ notifyEnabled: on });
                    playToggle(prefs.soundEnabled, on);
                  }}
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <span>
                  <span className="block font-medium text-white/85">
                    Zen mode
                  </span>
                  <span className="text-[10px] text-white/35">
                    Hide HUD chrome (toolbar Zen also works)
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={prefs.zenMode}
                  onChange={(e) => {
                    setPrefs({ zenMode: e.target.checked });
                    playToggle(prefs.soundEnabled, e.target.checked);
                  }}
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <span>
                  <span className="block font-medium text-white/85">
                    Keep screen awake
                  </span>
                  <span className="text-[10px] text-white/35">
                    During focus sessions (Wake Lock)
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={prefs.wakeLockEnabled ?? true}
                  onChange={(e) => {
                    setPrefs({ wakeLockEnabled: e.target.checked });
                    playToggle(prefs.soundEnabled, e.target.checked);
                  }}
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <span>
                  <span className="block font-medium text-white/85">
                    Haptics
                  </span>
                  <span className="text-[10px] text-white/35">
                    Soft vibration on complete / fail
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={prefs.hapticsEnabled ?? true}
                  onChange={(e) => {
                    setPrefs({ hapticsEnabled: e.target.checked });
                    playToggle(prefs.soundEnabled, e.target.checked);
                  }}
                />
              </label>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <span className="mb-2 block font-medium text-white/85">
                  Graphics
                </span>
                <p className="mb-2 text-[10px] text-white/35">
                  Auto uses low on mobile, low battery, or weak CPU
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ["auto", "Auto"],
                      ["low", "Low"],
                      ["high", "High"],
                    ] as const
                  ).map(([id, label]) => {
                    const active =
                      (prefs.graphicsQuality ?? "auto") === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPrefs({ graphicsQuality: id })}
                        className={`min-h-10 flex-1 rounded-lg px-2 py-2 text-xs font-bold transition touch-manipulation ${
                          active
                            ? "bg-sky-500 text-white"
                            : "border border-white/10 bg-black/30 text-white/55 hover:bg-white/10"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <span>
                  <span className="block font-medium text-white/85">
                    Daily goal
                  </span>
                  <span className="text-[10px] text-white/35">
                    Minutes of focus to count a streak day
                  </span>
                </span>
                <input
                  type="number"
                  min={10}
                  max={480}
                  value={stats.dailyGoalMinutes}
                  onChange={(e) =>
                    setDailyGoalMinutes(Number(e.target.value) || 50)
                  }
                  className="w-20 rounded-lg border border-white/15 bg-black/40 px-2 py-2 font-mono text-base text-white sm:text-sm"
                />
              </label>
            </div>
            <p className="mt-2 hidden text-[10px] text-white/30 sm:block">
              Keys: Space pause · B build · M lab · Z zen · Esc close
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-[10px] font-bold tracking-wider text-white/40 uppercase">
              Offline shell
            </h3>
            <p className="text-[11px] leading-relaxed text-white/40">
              After one online visit, the app shell can open offline (production
              build). Your progress is already local on this device. Open once
              on Wi‑Fi, then “Add to Home Screen” for the full phone experience.
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold tracking-wider text-white/40 uppercase">
              Sealed save
            </h3>
            <p className="mb-2 text-[11px] leading-relaxed text-white/40">
              Full snapshot with integrity hash. Editing the JSON breaks the
              seal — meteors may fall.
            </p>
            {cheaterStrike && (
              <div className="mb-2 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs text-rose-200">
                Integrity breach recorded. Resources scorched.
                <button
                  type="button"
                  onClick={() => clearCheaterStrike()}
                  className="mt-1 block font-bold text-rose-100 underline"
                >
                  Stabilize after meteor rain
                </button>
              </div>
            )}
            {saveMsg && (
              <p className="mb-2 text-[11px] text-sky-300/90">{saveMsg}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  playExport(prefs.soundEnabled);
                  const sealed = exportSave() as {
                    summary?: {
                      totalFocusMinutes?: number;
                      currentStreak?: number;
                      sessionsCompleted?: number;
                    };
                  };
                  downloadJson(
                    `observatory-save-${Date.now()}.json`,
                    sealed
                  );
                  const s = sealed.summary;
                  setSaveMsg(
                    s
                      ? `Exported · ${s.totalFocusMinutes ?? 0}m focus · streak ${s.currentStreak ?? 0}d · sealed`
                      : "Exported (sealed)"
                  );
                }}
                className="rounded-xl bg-sky-500/90 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15"
              >
                Import JSON
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const data = await readJsonFile(f);
                    const res = importSave(data);
                    setSaveMsg(
                      res.ok
                        ? "Import OK — integrity verified."
                        : (res.reason ?? "Import failed")
                    );
                  } catch {
                    setSaveMsg("Could not read file");
                  }
                  e.target.value = "";
                }}
              />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold tracking-wider text-rose-400/70 uppercase">
              Danger zone
            </h3>
            <button
              type="button"
              onClick={() => {
                if (
                  !window.confirm(
                    "Reset all progress on this browser? This cannot be undone."
                  )
                )
                  return;
                resetProgress();
                setSaveMsg("Progress reset.");
              }}
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20"
            >
              Reset all progress
            </button>
          </section>
        </div>

        <div className="shrink-0 border-t border-white/8 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
