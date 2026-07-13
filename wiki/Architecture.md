# Architecture

```text
page → ClientScene (R3F, ssr:false) + GameHUD
              │                      │
              └──────────┬───────────┘
                         ▼
                 useGameStore (Zustand)
                   + sealed persist
```

| Module | Role |
|--------|------|
| `src/store/useGameStore.ts` | All game actions |
| `src/lib/gameConfig.ts` | Economy / buildings |
| `src/lib/meta.ts` | Streaks, research, achievements |
| `src/lib/events.ts` | Ambient focus events |
| `src/lib/crew.ts` | Roster & buffs |
| `src/lib/audio.ts` | Procedural SFX |
| `src/lib/save.ts` | Seal / migrate / storage |
| `src/components/Scene.tsx` | 3D island |
| `src/components/IslandNpcs.tsx` | Clickable crew |
| `src/components/GameHUD.tsx` | DOM UI |

Deeper write-up: [`docs/ARCHITECTURE.md`](https://github.com/ArdaDDemir/floating-observatory/blob/master/docs/ARCHITECTURE.md)
