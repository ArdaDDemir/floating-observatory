# Player & systems guide

How Floating Observatory works — useful for demos, playtesters, and README deep-dives.

---

## Core loop

```text
  ┌─────────────┐     complete      ┌──────────────┐
  │ Focus quest │ ────────────────► │ Rewards      │
  │  timer runs │                   │ crystals + E │
  └──────┬──────┘                   └──────┬───────┘
         │ abandon                         │
         ▼                                 ▼
  ┌─────────────┐                   ┌──────────────┐
  │ Fail penalty│                   │ Build / meta │
  │ + lockout   │                   │ island grows │
  └─────────────┘                   └──────────────┘
```

1. **Start** a focus quest (preset or custom minutes, session tag).  
2. **Stay with it** — ambient events may add tiny loot; no decisions required.  
3. **Complete** → resources, journal entry, maybe daily-goal bonus + streak.  
4. **Build** between sessions: place, upgrade, research, assign crew.  
5. **Come back** tomorrow — streak multiplies rewards; gaps get a soft comeback gift.

---

## Resources

| Resource | Role |
|----------|------|
| **Crystals** | Primary building / upgrade currency (often blue side of costs) |
| **Energy** | Second currency (towers, dishes, mixed costs) |

Multipliers come from buildings, research, crew, streak, and observatory level.

---

## Focus sessions

- **Presets:** 5 / 15 / 25 / 45 / 60 minutes (+ custom 1–120).  
- **Pause** freezes the timer (Space).  
- **Give up** applies a fail penalty scaled by:
  - how early you quit,
  - fail streak,
  - shields / research / crew mitigation.
- **Lockout** after repeated fails (short cooldowns — not day-long bans).  
- **Tags** track time by intent (coding, study, deep work, creative, other).  
- **Break** after complete: short rest scene; skip allowed.

### Ambient events

While running (not paused), the island may fire flavor/reward toasts:

- No modal, no click required  
- Session caps + cooldowns so they stay rare  
- Signal dish + research “Calm Signal” improve loot/frequency  

---

## Buildings

| Building | Buff direction |
|----------|----------------|
| **Energy Core** | +% energy from sessions |
| **Data Tower** | +% crystals from sessions |
| **Botany Lab** | Small dual bonus |
| **Shield Gen** | Reduces fail penalties |
| **Signal Dish** | Better ambient event loot |

**Build mode:** pick a type → tap/click free tiles (core exclusion + island radius).  
**Selected building:** upgrade, relocate, destroy (partial refund).  
**Visual tiers** change as level rises (basic → reinforced → legendary look).

---

## Meta progression

### Daily goal & streak
- Default goal **50 minutes** focus / day (editable in Settings).  
- Hitting the goal **once per day** advances streak + flat crystal/energy bonus.  
- Streak multiplies future session rewards (scales up to multi-week).  
- Missing days resets streak; returning after a gap grants a **welcome-back** gift.

### Research
Permanent unlocks, e.g.:

- Efficient Harvest → +% session rewards  
- Resilient Core → less fail loss  
- Calm Signal → better ambient events  

### Cosmetics
Core and sky skins unlock via observatory level or achievements.

### Achievements
First session, session counts, focus hours, streaks, build milestones, clean runs, daily goal, etc. Toast on unlock.

### Crew
Slots grow with observatory level (2 → up to 12). New members join as you level.  
**Roles:** Worker, Gardener, Scout, Engineer, Caretaker, Archivist, Courier.  
**Assign:** Lab → Crew, or **tap the NPC on the island** and pick a building post.  
Buffs only apply while assigned.

---

## Saves & integrity

- Progress is **local** (no server).  
- Saves are **sealed** with an integrity hash (v3).  
- **Export / import** JSON from Settings.  
- Casual JSON edits that break the hash trigger a **meteor punishment** (resources scorched, dramatic VFX) — a playful anti-cheat, not military security.

---

## Settings that matter

| Setting | Effect |
|---------|--------|
| Sound cues | Full procedural SFX (session, build, crew, UI) — no sample files |
| Desktop notify | Alert when tab hidden (if permitted) |
| Zen | Minimal HUD during focus |
| Keep screen awake | Wake Lock during running focus |
| Haptics | Vibration on complete / fail |
| Graphics Auto/Low/High | 3D cost (shadows, DPR, bloom, particles) |
| Daily goal minutes | Streak threshold |

---

## Mobile vs desktop

| Desktop | Mobile |
|---------|--------|
| Dense HUD, hotkeys | Compact resources, bottom sheets |
| Hover tooltips | Tap-selected build info cards |
| Higher graphics default (Auto) | Low path by default |
| Mouse orbit | Touch orbit / zoom |

PWA: install to home screen after a production deploy. Offline shell loads after one online visit.
