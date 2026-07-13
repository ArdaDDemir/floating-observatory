# FAQ

### I don’t hear sound

1. Click once on the page (browser autoplay lock).
2. Settings → **Sound cues** on.
3. Hard refresh if an old save had sound off.

### Favicon / logo missing

Hard refresh (`Ctrl+Shift+R`). Icons live at:

- `/favicon.png`
- `/brand/logo.svg`
- `/icon` (App Router)

If you run on **port 3001**, paths are still the same host:  
`http://localhost:3001/favicon.png`

### Crew error / empty island NPCs

Refresh once — roster is normalized on rehydrate. Worst case: Settings → Reset progress.

### Is progress online?

No. Everything is **localStorage** on your device. Export a sealed save if you switch browsers.

### Can I use this commercially?

MIT license + procedural audio (no sample packs). See repo LICENSE.

### Docker vs Vercel

Both work. Docker is great for self-hosting; Vercel is one-click for the Next app.
