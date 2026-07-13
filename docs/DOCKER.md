# Docker

Floating Observatory ships as a multi-stage **production** image.

## Requirements

- Docker Engine 24+ (or Docker Desktop)
- Optional: Docker Compose v2

## Quick start

```bash
docker compose up --build
```

Open http://localhost:3000

Stop:

```bash
docker compose down
```

## Manual build / run

```bash
docker build -t floating-observatory .
docker run --rm -p 3000:3000 floating-observatory
```

## How it works

| Stage | Purpose |
|-------|---------|
| `deps` | `npm ci` |
| `builder` | `next build` with `output: "standalone"` |
| `runner` | Minimal Node 20 Alpine + standalone server |

- App listens on **`0.0.0.0:3000`**
- Game progress is **browser localStorage** (no DB volume needed)
- Offline SW still works in the browser after first load

## Healthcheck

Compose probes `GET /` via Node `fetch` every 30s.

## Notes

- Do **not** use this image for `next dev` — use local `npm run dev` for development.
- If you change `next.config.ts`, rebuild the image.
- Logo / brand assets live under `public/brand/` and are copied into the image via `public/`.
