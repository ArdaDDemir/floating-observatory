# Contributing

Thanks for interest in **Floating Observatory** ([@ArdaDDemir](https://github.com/ArdaDDemir)). This is a showcase + playable focus game; small, focused PRs are best.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development (no service worker) |
| `npm run build` | Production build |
| `npm start` | Serve production (SW registers) |
| `npm run lint` | ESLint |

## Guidelines

1. **Read** [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) before large changes.  
2. **Economy numbers** live in `src/lib/gameConfig.ts` / `meta.ts` — prefer changing knobs there over hardcoding in components.  
3. **No mid-session modals** for ambient events.  
4. **Keep mobile** in mind: safe areas, 44px-ish targets, graphics low path.  
5. **Saves:** if you change persisted shape, bump `SAVE_VERSION` and migrate carefully.  
6. Run `npm run lint` and `npx tsc --noEmit` before opening a PR.

## PR checklist

- [ ] What & why in the description  
- [ ] Screenshots if UI changed  
- [ ] No secrets / real user saves committed  
- [ ] Docs updated if knobs moved  

## Code of conduct

Be kind. This is a focus tool and a learning showcase — constructive feedback only.
