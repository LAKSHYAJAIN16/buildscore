# Multi-stage build for self-hosting on a plain Docker host (Coolify, or
# `docker run` directly on a Hetzner VPS). Requires next.config.ts's
# `output: "standalone"` for the lean runtime stage below.
#
# Build context must be the repo root (not web/), since Coolify's default
# "build from repo" flow does that; adjust COPY paths if you build with
# `docker build -f web/Dockerfile .` from web/ instead.

FROM node:22-alpine AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ ./
# variables.ts is gitignored (see .gitignore) -- the build needs *a* copy to
# import from; variables.example.ts's defaults are fine for the build step
# itself since these are runtime-tunable constants, not build-time secrets.
RUN if [ ! -f lib/buildscore/variables.ts ]; then cp lib/buildscore/variables.example.ts lib/buildscore/variables.ts; fi
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
