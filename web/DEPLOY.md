# Self-hosting on a VPS (Hetzner + Coolify)

This app self-hosts fine as a plain Docker container — Next.js's `after()`
(used for the background scan continuation) is officially supported on both
"Node.js server" and "Docker container" deployments, so no application code
had to change to move off Vercel. Postgres stays on Neon (a plain connection
string works from anywhere); nothing here requires self-hosting the database
too.

## 1. Provision the VPS

Create a Hetzner Cloud server (a small shared-vCPU instance is plenty to
start) and install [Coolify](https://coolify.io) on it, following Coolify's
own installer. This part is on you — it needs an account and a payment
method, not something that can be scripted from here.

## 2. Point Coolify at this repo

In Coolify: **New Resource → Application → Public/Private Git Repository**,
point it at this GitHub repo, and set:

- **Build pack**: Dockerfile
- **Dockerfile location**: `web/Dockerfile`
- **Base directory / build context**: repo root (the Dockerfile's `COPY`
  paths assume this — see the comment at the top of `web/Dockerfile`)
- **Port**: `3000`
- **Health check path**: `/api/health`

## 3. Environment variables

Set these in Coolify's environment variables panel for the app (same names
as `web/.env.example`):

| Variable | Value |
|---|---|
| `GITHUB_TOKEN` | A GitHub personal access token (no scopes needed for public data) |
| `DATABASE_URL` | Your Neon connection string (unchanged from local dev) |
| `INTERNAL_WORKER_SECRET` | `openssl rand -hex 32` |
| `APP_BASE_URL` | The public URL Coolify assigns/you configure for this app, e.g. `https://buildscore.yourdomain.com` — **not** `localhost`; this is used server-side to call the app's own `/api/scan/worker` route |
| `GROQ_API_KEY` | Optional. Enables ACID repo analysis via Groq's hosted API (free tier at console.groq.com) — everything else works without it. Deliberately *not* a locally-run model: a small Hetzner instance has no spare capacity to run LLM inference alongside the web app, and Groq's own infra is what actually scales here, not this VPS |

## 4. Run migrations against Neon

Migrations are plain SQL files under `web/drizzle/`; run them from anywhere
that can reach Neon (your own machine is fine, this doesn't need to run on
the VPS):

```
cd web
DATABASE_URL="<your neon connection string>" npx drizzle-kit migrate
```

## 5. Deploy

Trigger a deploy in Coolify (or push to the branch it's watching, if
auto-deploy is on). Coolify builds the Dockerfile, starts the container, and
proxies traffic to it (with automatic HTTPS via Let's Encrypt, handled by
Coolify's built-in Traefik).

## Notes

- **Rate limiting depends on the reverse proxy setting `x-forwarded-for` (or
  `x-real-ip`)** correctly — `web/lib/buildscore/ip.ts` reads those standard
  headers rather than Vercel's proprietary `x-real-ip`-only behavior. Coolify's
  default Traefik setup sets `x-forwarded-for` correctly out of the box; if
  you put another proxy in front of Coolify, verify that header still arrives
  intact.
- No Vercel-specific duration limits apply here, so the existing chunked-scan
  design (`SCAN_CHUNK_TIME_BUDGET_MS` etc. in `variables.ts`) is no longer
  strictly necessary for correctness — it's harmless to leave as-is (a scan
  just finishes in one chunk sooner when there's no artificial time
  pressure), so this wasn't ripped out. Revisit only if you want to simplify
  later.
