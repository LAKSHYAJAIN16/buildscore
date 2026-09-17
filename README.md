# Buildscore

I wanted a way to actually measure how good a builder someone is from their GitHub, instead of just eyeballing their profile. So this takes a GitHub username, pulls their public repos, and computes a "Builder Vector" — velocity, finishing, iteration, consistency, ambition, quality, ai_leverage — plus an overall Buildscore out of 100.

This is v0, so it's working off GitHub API metadata only, no real semantic diff/AST analysis yet (that's the plan for phase 2). `efficiency` isn't computed at all right now and shows up as `null`; the final score just gets renormalized across whatever dimensions are actually available.

## Setup

```
python -m venv .venv
.venv\Scripts\activate
pip install -e .
```

You'll need a GitHub personal access token (no scopes needed, it's all public data) from https://github.com/settings/tokens:

```
copy .env.example .env
# edit .env and paste your token, or just:
set GITHUB_TOKEN=ghp_xxx
```

Optionally grab a free key from https://console.groq.com and set `GROQ_API_KEY` if you want the LLM repo analysis (more below) — everything else works fine without it.

## Using it

```
buildscore <github-username>
buildscore <github-username> --pretty
buildscore <github-username> --max-repos 30
buildscore <github-username> --pretty --no-acid   # skip the LLM analysis even with a key set
```

## The LLM repo analysis (ACID)

If `GROQ_API_KEY` is set, each meaningful repo also gets run through an LLM for what I'm calling ACID (borrowing GitRoll's term: Architecture, Cross-Domain, Innovation, Documentation) — a short plain-English summary of what the repo actually does, plus four 1-5 sub-scores. Those scores feed into `ambition` (the Architecture/Cross-Domain/Innovation parts) and `quality` (Documentation), blended with the existing heuristics — see `src/buildscore/acid.py` and the `_repo_ambition_score`/`_repo_quality_score` functions in `scoring.py`.

It runs against Groq's hosted API (serving open models like Llama) rather than a paid closed-model API, mostly because it's much cheaper per token and scales properly through Groq's infra. I actually tried a local Ollama model first but dropped it — it only scales to the one machine it's running on, which is a problem once this gets ported to a real web backend. The whole thing is optional: without a key, `ambition`/`quality` just fall back to the plain heuristics, and `--no-acid` skips it even when a key's configured.

## The web app (`web/`)

`web/` has a Next.js 16 / React 19 app that turns all this scoring logic into an actual product — you type in a GitHub username at `app/[username]` and get a Buildscore page, plus a leaderboard, a grants section (micro-grant matching, backed by `lib/grants`), a quiz, a thesis writeup, and a blog. API routes live under `app/api/` (`scan`, `grants`, `health`). It's on Drizzle ORM against a Neon Postgres database and uses the OpenAI SDK for the LLM-backed parts, styled with Tailwind + shadcn/Base UI. `web/DESIGN.md` and `web/PRODUCT.md` have the product/design thinking, `web/DEPLOY.md` covers deployment.

To run it locally:

```
cd web
npm install
npm run dev
```

## Where it's rough right now

Being upfront about the v0 limitations:

- Commit activity comes from GitHub's `stats/commit_activity` endpoint, which only covers the trailing 52 weeks — so consistency/streak numbers reflect recent activity, not someone's whole history.
- "Technical ambition" is a crude proxy based on repo size and language mix, not real architectural analysis. It's a placeholder until phase 2.
- "Quality" and "AI leverage" are similarly rough: quality blends repo-structure signals (tests/CI/license presence) with commit-churn stability, and AI leverage looks at known AI tool config files plus a sample of recent commit messages for AI co-authorship trailers. Neither is real code review or actual AI-authorship detection — just proxies.
- Forks are excluded entirely, and private repos aren't visible without a different auth flow.
- There's no percentile normalization yet since there's no population to compare against — the 0-100 score is absolute, not "top N%".
