# Customizing Floating Observatory

Fork-friendly map of the important knobs. Paths are from the repo root.

---

## Economy (first place to edit)

**File:** [`src/lib/gameConfig.ts`](../src/lib/gameConfig.ts)

| Constant / function | What it does |
|---------------------|--------------|
| `STARTING_CRYSTALS` / `STARTING_ENERGY` | New player wallet |
| `DAILY_GOAL_BONUS` | Flat reward when daily goal is met |
| `COMEBACK_GIFT` | Resources when returning after a gap |
| `DURATION_PRESETS` | Quick duration chips |
| `rewardsForDuration()` | Base crystals/energy for a session length |
| `BUILDINGS` | Cost, per-level buffs, copy, accent color |
| `getUpgradeCost()` | Upgrade price curve |
| `computeFailPenalty()` | Abandon cost formula |
| `CORE_EXCLUSION_RADIUS` / `ISLAND_PLACE_RADIUS` | Placement rules |

### Example: friendlier start

```ts
export const STARTING_CRYSTALS = 200;
export const STARTING_ENERGY = 200;
```

### Example: richer 25-minute sessions

In `rewardsForDuration`, raise the `minutes * 1.05` multiplier (e.g. `1.2`).

### Example: new building buff

Edit the `BUILDINGS` entry’s `crystalBonusPerLevel` / `energyBonusPerLevel` / fail or event fields.  
If you add a **new building type**, you must also:

1. Extend `BuildingType` union  
2. Add a model under `src/components/buildings/`  
3. Wire it in `BuildingModel.tsx`  
4. Consider crew/event hooks if needed  

---

## Streaks, research, achievements

**File:** [`src/lib/meta.ts`](../src/lib/meta.ts)

| Area | What to change |
|------|----------------|
| `DEFAULT_DAILY_GOAL_MINUTES` | Default daily quota |
| `failLockoutMs()` | Cooldown after consecutive fails |
| `streakRewardMultiplier()` | Return incentive strength |
| `RESEARCH` | Names, costs, descriptions |
| `ACHIEVEMENTS` | IDs, copy, icons |
| `CORE_SKINS` / `SKY_SKINS` | Cosmetics unlock rules |
| `observatoryLevel()` | Level curve from total focus seconds |
| `breakSecondsForSession()` | Break length |

Research **effect wiring** lives in the store (`efficientHarvest`, `resilientCore`, `calmSignal` keys in `useGameStore`).

---

## Ambient events

**File:** [`src/lib/events.ts`](../src/lib/events.ts)

| Piece | Notes |
|-------|--------|
| `FOCUS_EVENTS` | Titles, weights, rewards, min session length |
| `createSessionEventRuntime()` | First cooldown timing |
| `maxEventsForSession()` | Cap per quest |
| Tick chance / cooldown | Inside `tickFocusEvents()` |

Keep events **passive** (no mid-session decisions) so focus isn’t broken.

---

## Crew

**File:** [`src/lib/crew.ts`](../src/lib/crew.ts)

- Role list & descriptions (`CREW_ROLES`, body styles for 3D)  
- `crewSlotsForLevel()` — 2 base → +1/level → max 12  
- `ensureCrewRoster()` — grows roster (never fires people)  
- `computeCrewBuffs()` — mechanical effects when assigned  

## Audio (procedural / no samples)

**File:** [`src/lib/audio.ts`](../src/lib/audio.ts)

All cues are generated with Web Audio oscillators + noise (no WAV/MP3).  
Default on (`prefs.soundEnabled`). Unlock on first pointer/key.

| Export | When it plays |
|--------|----------------|
| `playStartSession` | Focus starts |
| `playPause` / `playResume` | Pause controls |
| `playCompleteChime` / `playDailyGoal` | Quest complete / daily hit |
| `playFailThud` / `playLockout` | Give up / cooldown |
| `playEventTick` / `playEventFlavor` | Ambient events |
| `playMinuteTick` | Soft blip each focus minute |
| `playHalfway` / `playFinalStretch` | Session milestones |
| `playBreakStart` / `playBreakEnd` | Break flow |
| `playPlaceBuilding` / `playUpgrade` / `playDestroy` / `playRelocate` | Island build |
| `playBuildModeOn` / `Off` | Build tray toggle |
| `playAssignCrew` / `playRecruit` / `playSelectNpc` | Crew |
| `playResearch` / `playAchievement` | Meta |
| `playError` / `playToggle` / `playExport` / `playImportOk` | UI / saves |
| `playMeteor` | Integrity punishment |

Wire new SFX from store actions in `useGameStore.ts` (prefer store over scattered UI clicks).

---

## Save format & anti-tamper

**File:** [`src/lib/save.ts`](../src/lib/save.ts)

| Piece | Careful |
|-------|---------|
| `SAVE_VERSION` / `SAVE_STORAGE_KEY` | Bump when breaking payload shape |
| `PEPPER` | Obfuscation only — not a secret once shipped |
| `sealSave` / `openSave` | Export integrity |
| `createSealedLocalStorage` | Persist middleware + v2 migrate |
| `migrateLegacySaveIfPresent()` | Old key → sealed v3 |

Changing hash fields without migration will mark old saves as tampered.

---

## 3D look & performance

| File | Controls |
|------|----------|
| [`src/components/Scene.tsx`](../src/components/Scene.tsx) | Lights, fog, sparkles, bloom, orbit, mobile camera |
| [`src/components/buildings/*`](../src/components/buildings/) | Mesh design per type |
| [`src/lib/buildingVisual.ts`](../src/lib/buildingVisual.ts) | Level → tier mapping |
| [`src/lib/perf.ts`](../src/lib/perf.ts) | Auto/Low/High graphics profile |
| [`src/components/IslandNpcs.tsx`](../src/components/IslandNpcs.tsx) | Ambient crew on the island |
| [`src/components/CheatMeteors.tsx`](../src/components/CheatMeteors.tsx) | Tamper VFX |

User-facing quality toggle: **Settings → Graphics** (`prefs.graphicsQuality`).

---

## UI / branding

| File | Purpose |
|------|---------|
| [`src/components/GameHUD.tsx`](../src/components/GameHUD.tsx) | Main chrome, quest panel, build bar |
| [`src/components/Onboarding.tsx`](../src/components/Onboarding.tsx) | First-run primer copy |
| [`src/components/GuidePanel.tsx`](../src/components/GuidePanel.tsx) | In-app field manual |
| [`src/app/layout.tsx`](../src/app/layout.tsx) | Title, theme, viewport |
| [`src/app/manifest.ts`](../src/app/manifest.ts) | PWA name / colors |
| [`src/app/icon.tsx`](../src/app/icon.tsx) | Generated app icon |
| [`src/app/globals.css`](../src/app/globals.css) | Theme tokens, safe-area helpers |

Copy tone is “soft sci-fi observatory” — keep event/building text consistent if you rebrand.

---

## Audio & haptics

| File | Role |
|------|------|
| [`src/lib/audio.ts`](../src/lib/audio.ts) | WebAudio beeps (no asset files) |
| [`src/lib/haptics.ts`](../src/lib/haptics.ts) | `navigator.vibrate` patterns |

Toggle from Settings (persisted prefs).

---

## Offline PWA

| File | Role |
|------|------|
| [`public/sw.js`](../public/sw.js) | Cache strategy (production only) |
| [`public/offline.html`](../public/offline.html) | Offline fallback page |
| [`src/components/ServiceWorkerRegister.tsx`](../src/components/ServiceWorkerRegister.tsx) | Register + update banner |

Bump `VERSION` in `sw.js` when you change caching rules.

---

## Game state & actions

**File:** [`src/store/useGameStore.ts`](../src/store/useGameStore.ts)

All mutations: start/tick/complete/fail, place/upgrade, research, import/export, day rollover.  
Prefer adding actions here rather than scattering `set` calls in UI.

---

## Suggested “mod packs”

Easy showcase forks:

1. **Study mode** — softer fail, higher short-session rewards  
2. **Hardcore** — stronger fail tax, no comeback gift  
3. **Cozy** — more ambient events, lower building costs  
4. **Re-skin** — new palette in Scene materials + `globals.css` + icon  

Document your fork’s changes in *your* README so reviewers see the delta.
