# Buildscore CLI

Heuristic v0 of the Buildscore pipeline. Given a GitHub username, fetches their
public repos and computes a Builder Vector (velocity, finishing, iteration,
consistency, ambition, quality, ai_leverage) and an overall Buildscore, using
GitHub API metadata only — no semantic diff/AST analysis yet (that's phase 2).

`efficiency` is not computed in this version and shows up as `null`; the final
score is renormalized across whichever dimensions are available.

## Setup

```
python -m venv .venv
.venv\Scripts\activate
pip install -e .
```

Create a GitHub personal access token (no scopes needed for public data) at
https://github.com/settings/tokens and set it:

```
copy .env.example .env
# edit .env and paste your token, or just:
set GITHUB_TOKEN=ghp_xxx
```

Optionally, also grab a free API key at https://console.groq.com and set
`GROQ_API_KEY` to enable ACID repo analysis (see below) — everything else
works fine without it.

## Usage

```
buildscore <github-username>
buildscore <github-username> --pretty
buildscore <github-username> --max-repos 30
buildscore <github-username> --pretty --no-acid   # skip ACID even with a key set
```

## ACID repo analysis (optional)

When `GROQ_API_KEY` is set, each meaningful repo also gets an LLM-based
analysis — our version of what GitRoll calls ACID (Architecture, Cross-Domain,
Innovation, Documentation): a 1-2 sentence plain-English summary of what the
repo actually does, plus four 1-5 sub-scores. These feed into `ambition`
(Architecture/Cross-Domain/Innovation) and `quality` (Documentation) as a
blend with the existing heuristics — see `src/buildscore/acid.py` and
`_repo_ambition_score`/`_repo_quality_score` in `scoring.py`.

Runs against Groq's hosted API serving open-source models (Llama etc.)
rather than a paid closed-model API — real elastic scaling via Groq's own
infra, and much cheaper per-token than Claude/GPT. (A local Ollama instance
was tried first but rejected: it doesn't scale past the single machine it
runs on, which matters once this gets ported to the web backend.) It's
entirely optional — without a key, `ambition`/`quality` fall back to the
pre-existing heuristics unchanged, and `--no-acid` skips it even if a key is
configured.

## Known limitations (v0)

- Commit activity comes from GitHub's `stats/commit_activity` endpoint, which
  only covers the trailing 52 weeks — consistency/streak metrics reflect
  recent activity, not full account history.
- "Technical ambition" is a crude proxy based on repo size and language mix,
  not real architectural analysis. Treat it as a placeholder.
- "Quality" and "AI leverage" are also v0 heuristics, not real code review or
  AI-authorship detection: quality blends repo-structure signals (tests/CI/
  license presence) with commit-churn stability; AI leverage blends known AI
  tool config files with a sample of recent commit messages for AI
  co-authorship trailers. Both are proxies, not ground truth.
- Forks are excluded entirely; private repos aren't visible without a
  different auth flow.
- No percentile normalization yet — there's no population to compare against.
  The 0-100 score is absolute, not "top N%".
