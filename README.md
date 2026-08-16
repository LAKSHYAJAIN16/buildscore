# Buildscore CLI

Heuristic v0 of the Buildscore pipeline. Given a GitHub username, fetches their
public repos and computes a Builder Vector (velocity, finishing, iteration,
consistency, ambition) and an overall Buildscore, using GitHub API metadata
only — no semantic diff/AST analysis yet (that's phase 2).

`quality`, `ai_leverage`, and `efficiency` are not computed in this version
and show up as `null`; the final score is renormalized across whichever
dimensions are available.

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
- Forks are excluded entirely; private repos aren't visible without a
  different auth flow.
- No percentile normalization yet — there's no population to compare against.
  The 0-100 score is absolute, not "top N%".
