# Buildscore

> Turns a GitHub username into a "Builder Vector" and a 0-100 Buildscore.

I wanted a way to actually measure how good a builder someone is from their GitHub instead of eyeballing their profile. It pulls a user's public repos and scores velocity, finishing, iteration, consistency, ambition, quality, and ai_leverage. This is v0 — it works off GitHub API metadata only (no semantic diff/AST analysis yet), `efficiency` isn't computed and shows `null`, and the final score renormalizes across whatever dimensions are available.

## Setup
```
python -m venv .venv
.venv\Scripts\activate
pip install -e .
```

Get a GitHub personal access token (no scopes needed) from https://github.com/settings/tokens:
```
copy .env.example .env
# edit .env and paste your token, or:
set GITHUB_TOKEN=ghp_xxx
```

Optionally set `GROQ_API_KEY` (free at https://console.groq.com) for LLM repo analysis — everything else works without it.

## Usage
```
buildscore <github-username>
buildscore <github-username> --pretty
buildscore <github-username> --max-repos 30
buildscore <github-username> --pretty --no-acid   # skip LLM analysis even with a key set
```

## LLM repo analysis (ACID)
With `GROQ_API_KEY` set, each meaningful repo gets run through an LLM for ACID (Architecture, Cross-Domain, Innovation, Documentation) — a plain-English summary plus four 1-5 sub-scores that feed into `ambition` and `quality`, blended with the existing heuristics (`src/buildscore/acid.py`, `scoring.py`). Runs on Groq's hosted API rather than a closed-model API or local Ollama, since it's cheaper per token and scales past one machine. Optional throughout: no key means plain heuristics, `--no-acid` skips it regardless.

## Web app (`web/`)
Next.js 16 / React 19 app that turns the scoring logic into a product: a Buildscore page per username, a leaderboard, a grants section (micro-grant matching via `lib/grants`), a quiz, a thesis writeup, and a blog. Drizzle ORM on Neon Postgres, OpenAI SDK for the LLM parts, Tailwind + shadcn/Base UI. See `web/DESIGN.md`, `web/PRODUCT.md`, `web/DEPLOY.md`.

```
cd web
npm install
npm run dev
```

## Known rough edges (v0)
- Commit activity comes from GitHub's `stats/commit_activity`, which only covers the trailing 52 weeks
- "Ambition" is a proxy from repo size/language mix, not real architectural analysis
- "Quality" and "AI leverage" are heuristic proxies (repo structure, commit churn, AI config files/co-authorship trailers), not real code review or AI-authorship detection
- Forks are excluded; private repos need a different auth flow
- No percentile normalization yet — the score is absolute, not "top N%"
