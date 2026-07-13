# Getting Started

## Requirements

- **Node.js 20+** (recommended)
- npm 10+
- Optional: **Docker** 24+

## Local development

```bash
git clone https://github.com/ArdaDDemir/floating-observatory.git
cd floating-observatory
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)  
(or whatever port Next prints, e.g. **3001** if 3000 is busy).

## Production (local)

```bash
npm run build
npm start
```

Production enables the **service worker** offline shell.

## Docker

```bash
docker compose up --build
```

→ http://localhost:3000

Details: [Docker](Docker)

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve production |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run screenshots` | Capture README images |
| `npm run docker:up` | Compose up --build |

## First launch tips

1. Click once anywhere so **audio unlocks** (browser policy).
2. **Settings → Sound cues** should be on by default.
3. Start a short session or place a building to hear SFX.
4. Progress is stored in **localStorage** on your machine only.
