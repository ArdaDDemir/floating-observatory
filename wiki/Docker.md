# Docker

## One command

```bash
docker compose up --build
```

Open http://localhost:3000

## Manual

```bash
docker build -t floating-observatory .
docker run --rm -p 3000:3000 floating-observatory
```

## Details

- Multi-stage Dockerfile (Node 20 Alpine)
- Next.js `output: "standalone"` when `DOCKER_BUILD=1` (Dockerfile only)
- No DB volume — saves are client-side
- Healthcheck hits `GET /`

Full notes: repo file [`docs/DOCKER.md`](https://github.com/ArdaDDemir/floating-observatory/blob/master/docs/DOCKER.md)
