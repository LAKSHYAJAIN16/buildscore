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

## Usage

```
buildscore <github-username>
buildscore <github-username> --pretty
buildscore <github-username> --max-repos 30
```

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
