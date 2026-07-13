# Floating Observatory — Full Feature Roadmap

> **For Claude:** Implement task-by-task; keep focus sessions non-blocking (no modals mid-session).

**Goal:** Turn the existing Pomodoro island prototype into a durable focus habit game: daily rhythm, breaks, meta progression, cosmetics, and polish — without stealing attention during focus.

**Architecture:** Expand pure config modules (`lib/meta.ts`, `lib/gameConfig.ts`, `lib/audio.ts`, `lib/save.ts`) + Zustand store as single source of truth. UI panels stay thin; 3D scene reads cosmetic/unlock flags only.

**Tech Stack:** Next.js 16 App Router, React 19, Zustand persist, R3F, Framer Motion, Web Audio API, optional Notification API, web app manifest (PWA-lite).

**Principle:** *Session middle never demands a decision. Rewards and meta systems fire at boundaries (start / pause / complete / fail / idle).*

---

## Research summary (competitors)

| Source | Takeaway applied here |
|--------|------------------------|
| Forest | Daily visual growth, streak identity, ambient world |
| Focumon | Break calculation, flexible timer, soft multiplayer later |
| Legend of Pomodoro / Age of Pomodoro | Idle growth from real focus minutes |
| Yu-Kai Chou random rewards | Ambient events already live; keep rare |
| Productivity Challenge Timer | Achievements + level ladder |

---

## Feature backlog (implementation order)

### A — Habit loop
1. **Daily goal** — target minutes/day (default 50), progress bar on idle  
2. **Day streak** — complete ≥ goal (or ≥1 session) updates streak; miss resets  
3. **Streak buff** — 3d +10%, 7d +20% session rewards (shown idle, applied on complete)  
4. **Break timer** — optional post-complete break (default ~20% of session, min 3 / max 15 min)  
5. **Session tags** — coding / study / deep / creative / other; stats by tag  

### B — Meta progression
6. **Achievements** — 12 badges, unlock toast only  
7. **Observatory level** — XP = total focus seconds; unlocks visuals + soft bonuses  
8. **Research tree** — 3 permanent techs (harvest, resilient, calm signal)  
9. **New buildings** — Shield Generator (fail mitigation), Signal Dish (event reward bump)  

### C — World & cosmetics
10. **Visual unlocks** — garden ring, antenna array, debris density by obs level  
11. **Core / sky cosmetics** — unlock by achievements or level; equip from panel  

### D — Polish & platform
12. **Audio** — mute default; soft chime on complete/event; ambient optional  
13. **Zen mode** — hide chrome, show timer + pause only  
14. **Keyboard** — Space pause/resume, B build, Esc exit modes  
15. **Notifications** — opt-in “session complete” when tab hidden  
16. **Export / import save** — JSON download/upload  
17. **PWA-lite** — manifest + theme-color + installable metadata  
18. **Prefs panel** — sound, notify, daily goal, zen  

### Explicit non-goals (this plan)
- Multiplayer / chat  
- Mid-session mini-games  
- Real money IAP  
- Full i18n (EN UI remains; copy can be EN)

---

## Data model additions

```ts
// stats
dailyFocusSeconds, dailyGoalMinutes, lastActiveDate (YYYY-MM-DD),
currentStreak, longestStreak, focusByTag: Record<Tag, seconds>

// meta
unlockedAchievements: string[]
research: { efficientHarvest, resilientCore, calmSignal }
cosmetic: { coreSkin, skySkin }
prefs: { soundEnabled, ambientEnabled, notifyEnabled, zenMode }

// session
sessionTag: Tag | null
break: { total, remaining } | null  // status === 'break'
status: idle | running | paused | break | failed | completed
```

**Persist:** all meta + stats + buildings + prefs.  
**Do not persist:** event toasts, mid-session timer (reload → idle), break mid-progress optional drop.

---

## Files

| Path | Role |
|------|------|
| `src/lib/meta.ts` | tags, achievements, research, cosmetics, daily/streak helpers, obs level |
| `src/lib/audio.ts` | playChime, playEventTick (Web Audio) |
| `src/lib/save.ts` | export/import JSON |
| `src/lib/gameConfig.ts` | new buildings, reward/penalty with global mods |
| `src/lib/events.ts` | calmSignal / signal dish hooks |
| `src/store/useGameStore.ts` | all actions |
| `src/components/GameHUD.tsx` | wire panels |
| `src/components/MetaPanel.tsx` | achievements, research, cosmetics, export |
| `src/components/DailyStrip.tsx` | streak + daily goal |
| `src/components/buildings/ShieldModel.tsx` | new model |
| `src/components/buildings/SignalDishModel.tsx` | new model |
| `src/components/Scene.tsx` | cosmetics + unlocks |
| `src/app/manifest.ts` | PWA manifest |
| `src/app/layout.tsx` | metadata |

---

## Task checklist

### Task 1 — Config & meta modules
Create `meta.ts`, expand `gameConfig` buildings & formulas.

### Task 2 — Store
Integrate daily roll, streak, break, tags, achievements checks, research purchase, cosmetics equip, prefs, import/export actions.

### Task 3 — Buildings
Shield + Signal models; inventory + placement.

### Task 4 — HUD surfaces
Idle: tags, daily strip, start. Complete: break CTA. Break panel. Meta drawer. Zen layout. Prefs.

### Task 5 — Systems glue
Audio on complete/event; keyboard hook; notifications; save export UI.

### Task 6 — Scene & PWA
Cosmetic colors, unlock meshes, manifest.

### Task 7 — Verify
`npx tsc --noEmit` + manual path smoke.

---

## Reward / penalty formulas (final)

```
reward = base * buildingMult * streakMult * researchHarvestMult * obsLevelMult
penalty = rawFail * (1 - shieldReduction) * (1 - researchResilient) * early * failStreak
eventReward *= 1 + signalDishBonus + calmSignal?0:0  // calm reduces cooldown only
```

---

## Testing (manual)

1. Complete 5s test → reward + achievement toast if first  
2. Start break → countdown → idle  
3. Set daily goal low, complete → streak 1  
4. Place shield → fail → lower penalty  
5. Buy research → next complete higher reward  
6. Export JSON → reset → import restores  
7. Zen mode hides side panels  
8. Space pauses/resumes  

---

## Execution

User requested: plan then implement **all** items in this document in one pass.
