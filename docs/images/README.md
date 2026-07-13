# Screenshots

Generated from the live app for the GitHub README.

## Regenerate

```bash
# terminal A
npm run build && npm start

# terminal B
npm run screenshots
# or: node scripts/capture-screenshots.mjs http://localhost:3000
```

Requires `playwright` + Chromium (`npx playwright install chromium`).

## Files

| File | Content |
|------|---------|
| `desktop-idle.png` | PC hub + island + quest panel |
| `desktop-focus.png` | Active 25m focus session |
| `desktop-paused.png` | Paused session |
| `desktop-build.png` | Build mode + 5 building types |
| `desktop-build-select.png` | Energy Core detail card |
| `desktop-guide.png` | In-app field manual |
| `desktop-lab.png` | Research lab modal |
| `mobile-idle.png` | Phone island + compact HUD |
| `mobile-quest.png` | Phone quest form |
| `mobile-focus.png` | Phone focus timer |
| `mobile-build.png` | Phone island (menu collapsed) |
| `mobile-settings.png` | Settings bottom sheet |
| `tablet-landscape.png` | Wide / landscape build |
