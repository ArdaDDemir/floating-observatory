# Publishing checklist (GitHub + Vercel)

## 1. Polish before push

- [x] GitHub user set: **[ArdaDDemir](https://github.com/ArdaDDemir)**
- [x] `package.json` / README clone URLs point to `ArdaDDemir/floating-observatory`
- [ ] Optional: add screenshots to `docs/images/`
- [ ] `npm run lint` && `npm run typecheck` && `npm run build`
- [ ] Confirm no secrets / personal save files in the tree

## 2. Create the repo

```bash
git status
git add .
git commit -m "feat: Floating Observatory — focus island game + docs"
```

On GitHub (as **ArdaDDemir**): **New repository** → name **`floating-observatory`** → public.

```bash
git remote add origin https://github.com/ArdaDDemir/floating-observatory.git
git branch -M main
git push -u origin main
```

## 3. Repo settings (show-ready)

| Setting | Suggestion |
|---------|------------|
| **About** | “Pomodoro focus game with a living 3D island — Next.js, R3F, PWA” |
| **Topics** | `pomodoro` `threejs` `nextjs` `react` `pwa` `game` `zustand` `typescript` |
| **Website** | Your Vercel URL after deploy |
| **Social preview** | Upload a wide PNG of the island (Settings → Social preview) |

## 4. Deploy (Vercel)

1. Import the GitHub repo  
2. Framework: Next.js (auto)  
3. Build: `npm run build` · Output: default  
4. After deploy: open site once online → offline shell + PWA install work  

## 5. First-star pitch (optional README top)

If you have a live demo:

```md
**Live demo:** https://your-app.vercel.app
```

Paste under the badges in `README.md`.
