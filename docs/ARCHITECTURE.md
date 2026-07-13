# Architecture

Engineering overview for reviewers and contributors.

---

## High-level

```text
┌──────────────────────────────────────────────────────────┐
│  Next.js App Router (src/app)                            │
│  page → ClientScene (dynamic, ssr:false) + GameHUD       │
└───────────────┬────────────────────────────┬─────────────┘
                │                            │
                ▼                            ▼
┌───────────────────────────┐  ┌────────────────────────────┐
│  R3F Canvas (Scene)       │  │  React HUD (DOM)           │
│  Island · buildings · NPC │  │  Timer · build · panels    │
│  post FX · orbit · meteors│  │  Framer Motion toasts      │
└─────────────┬─────────────┘  └─────────────┬──────────────┘
              │                              │
              └──────────────┬───────────────┘
                             ▼
                 ┌───────────────────────┐
                 │  Zustand useGameStore │
                 │  + sealed localStorage│
                 └───────────────────────┘
```

- **No backend.** All progression is client-side.  
- **Single store** owns economy, session, island, meta.  
- **3D and HUD** both subscribe to the store; 3D uses selective / shallow selectors for perf.

---

## State machine (session)

```text
idle ──start──► running ◄──resume── paused
                  │                   ▲
                  │ tick…             │ pause
                  ▼                   │
              complete ──► completed / break ──► idle
                  │
                  fail ──► failed ──► idle (stabilize)
```

- **Tick:** `setInterval` in `GameHUD` → `tickQuest()` every 1s while `running`.  
- **Complete path:** only when `timeRemaining === 0` inside `tickQuest` (avoids double-complete races).  
- **Break:** separate `tickBreak()` countdown.

---

## Persistence (sealed save v3)

```text
partialize(state) → createSealedLocalStorage.setItem
                         │
                         ├─ build SavePayload
                         ├─ integrityHash(canonical body + pepper)
                         └─ localStorage[observatory-save-v3]

getItem → verify integrity → optional cheaterStrike flag
onRehydrate → merge prefs defaults · day rollover · crew sync
```

| Concern | Implementation |
|---------|----------------|
| Canonical body | Sorted stable stringify of gameplay fields |
| Hash | Sync FNV-style mix in `save.ts` (not WebCrypto) |
| Legacy | One-shot migrate from `observatory-save-v2` |
| Export | `exportSave()` returns sealed JSON download |
| Tamper | `punishCheater` + `CheatMeteors` |

Integrity is **casual anti-edit**, not server authority.

---

## Economy pipeline (complete)

```text
base = rewardsForDuration(duration)
     × building multipliers
     × streak × observatory × research
     × crew bonuses
     + optional daily goal bonus
     → resources += reward
```

Fail uses `computeFailPenalty` with mitigation stack (shields + research + crew).

---

## 3D pipeline

1. `ClientScene` dynamically imports `Scene` with `ssr: false`.  
2. `Canvas` config from `useGraphicsProfile(prefs.graphicsQuality)`.  
3. `FloatingIsland` holds terrain, core, grid placement, building meshes.  
4. Placement: snap to grid, `CORE_EXCLUSION_RADIUS`, occupancy check; store also validates.  
5. Orbit: mouse / touch (1-finger rotate, 2-finger dolly).  
6. Post: Bloom + Vignette via `@react-three/postprocessing`.  
7. Shadows: `PCFShadowMap` only when profile allows (not deprecated soft map).

Perf levers: DPR, antialias, sparkle counts, break FX, shadow maps, `powerPreference`.

---

## Mobile strategy

| Layer | Behavior |
|-------|----------|
| Detection | `useIsMobile` + `isMobileDevice()` (width / coarse pointer) |
| HUD | Safe-area padding, bottom sheets, compact focus timer |
| Graphics | Auto profile → low on mobile / low battery / weak CPU |
| Focus | Wake Lock optional; toolbar auto-collapsed during session |
| PWA | Manifest + icons; SW only in **production** |

---

## Offline service worker

**File:** `public/sw.js` (registered by `ServiceWorkerRegister` when `NODE_ENV === "production"`).

| Request type | Strategy |
|--------------|----------|
| Navigation | Network-first → cache → `offline.html` |
| Static assets (`/_next/static`, icons…) | Cache-first + background refresh |
| Install | Best-effort precache shell URLs |

Dev intentionally **does not** register the SW (HMR-safe).

---

## Key modules

| Module | Responsibility |
|--------|----------------|
| `useGameStore` | All game actions + persist |
| `gameConfig` | Numbers & building defs |
| `meta` | Streak / research / achievements / tags |
| `events` | Ambient focus event runtime |
| `crew` | Roster, slots 2→12, roles, island NPC assign |
| `audio` | Procedural Web Audio SFX library |
| `IslandNpcs` | Clickable crew on island |
| `NpcAssignPanel` | Assign post after NPC click |
| `save` | Seal / open / storage adapter |
| `perf` | Graphics quality resolution |
| `GameHUD` | DOM game shell |
| `Scene` | WebGL island |

---

## Testing checklist (manual)

- [ ] Start 5s test quest → complete rewards  
- [ ] Pause / resume mid-session  
- [ ] Give up → penalty + optional lockout  
- [ ] Place / upgrade / relocate / destroy building  
- [ ] Export save → import save  
- [ ] Corrupt integrity field → meteor path  
- [ ] Mobile layout + build place  
- [ ] `npm run build && npm start` → SW online then offline reload  

---

## Design constraints

1. **Focus purity** — no modal decisions during a running timer.  
2. **Local-first** — offline progress must not depend on network.  
3. **Fair fail** — punish abandonment, not delete a whole week.  
4. **Return loop** — streak + daily goal + comeback gift.  
5. **Show-ready code** — clear folders, typed store, documented knobs.
