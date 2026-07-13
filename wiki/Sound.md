# Sound

All SFX are **procedural Web Audio** — no MP3/WAV, no third-party packs. Safe for open-source and commercial use.

**Default:** Sound cues **on** (`prefs.soundEnabled`).

Browsers require a user gesture: click once after load to unlock audio.

## Catalogue (highlights)

| Category | Cues |
|----------|------|
| Session | Start, pause, resume, complete, daily goal, fail, lockout |
| Focus | Event loot / flavor, minute tick, halfway, final stretch |
| Break | Start, end |
| Build | Place, upgrade, destroy, relocate, build mode on/off, select |
| Crew | Select NPC, assign, recruit |
| Meta / UI | Research, achievement, toggles, export/import, error, meteor |

## Code

- Library: `src/lib/audio.ts`
- Wired mainly from `src/store/useGameStore.ts`
- Settings toggle: Settings → **Sound cues**

To add a cue: implement `playSomething()` in `audio.ts`, then call it from a store action.
