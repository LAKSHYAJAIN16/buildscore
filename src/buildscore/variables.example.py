"""Tunable thresholds and weights for the Buildscore heuristics.

Every value here is a judgment call, not a derived constant. Centralized
so they're easy to find and retune without digging through the pipeline
code (lifecycle.py, scoring.py, github_client.py, security.py, cli.py
all import from here instead of defining their own).

This is the committed template. Copy it to variables.py (gitignored) and
tune freely -- keeping the exact thresholds out of the public repo raises
the bar against gaming the score (same reasoning as the "Anti-Gaming"
section of the original design doc).
"""

from __future__ import annotations

# --- Repo tiering / resource budget ---

# Repos at or below this size in KB (from the bulk repo listing -- free,
# no extra API call) skip the full per-repo pipeline (releases,
# languages, commit_activity, code_frequency) entirely and are scored
# as trivial/empty without spending API calls on them.
SMALL_REPO_SIZE_KB_THRESHOLD = 50

# --- GitHub API client (github_client.py) ---

# Stop making calls once remaining quota drops below this, rather than
# letting GitHub 403 us mid-run.
RATE_LIMIT_SAFETY_MARGIN = 20

# GitHub computes /stats/* endpoints asynchronously per repo and
# returns 202 until the cache is warm. On a cold cache (first time
# these stats have ever been requested for a repo) this can genuinely
# take 30-60s+, especially when many repos are queued back-to-back in
# one run. Once warm, GitHub caches the result, so this cost is
# effectively one-time per repo. Retries here cost wall-clock time,
# not meaningful rate-limit budget -- don't cut this to "save
# resources"; the actual rate-limit safeguard is RATE_LIMIT_SAFETY_MARGIN.
STATS_MAX_RETRIES = 8
STATS_RETRY_BACKOFF_SECONDS = 2

# --- Security / suspicious usage detection (security.py) ---

# Allowed slack (in API calls) between expected and actual remaining
# quota before flagging possible concurrent token usage.
DRIFT_TOLERANCE = 5

# --- CLI defaults (cli.py) ---

# High by default since repo tiering keeps the API cost of small/empty
# repos near zero -- this is really just a safety cap, not a practical
# limit for most accounts.
DEFAULT_MAX_REPOS = 1000

# --- Activeness score (lifecycle.py) ---
#
# Replaces a hard active/dormant/abandoned cliff with a continuous
# 0-100 score blended from three signals computed off the repo's full
# commit history (via stats/code_frequency, which -- unlike
# stats/commit_activity -- isn't limited to the trailing 52 weeks):
# how often work happens, how substantial it is, and how recently it
# happened (smoothly decayed, not a hard cutoff).

ACTIVENESS_FREQUENCY_WEIGHT = 0.35
ACTIVENESS_MAGNITUDE_WEIGHT = 0.25
ACTIVENESS_RECENCY_WEIGHT = 0.40

# Weekly code churn (additions + deletions) treated as "a full week of
# solid work" for magnitude scoring; log-scaled so one huge commit
# (vendored code, a big refactor) doesn't dominate the score.
MAGNITUDE_REFERENCE_WEEKLY_CHURN = 400

# Recency decays by half every RECENCY_HALF_LIFE_DAYS since the last
# active week, instead of falling off a cliff at some day count.
RECENCY_HALF_LIFE_DAYS = 120

# Below this activeness score, a meaningful repo counts toward
# graveyard_rate.
ACTIVENESS_GRAVEYARD_THRESHOLD = 15

# Display-only buckets for human-readable labels (--pretty output).
# Cosmetic only -- never used in scoring math.
ACTIVENESS_LABEL_THRIVING = 70
ACTIVENESS_LABEL_ACTIVE = 40
ACTIVENESS_LABEL_COOLING = 15

# --- Scoring (scoring.py) ---

# Weighted contribution of each Builder Vector dimension to the final
# score. Dimensions with no computed value are excluded and the rest
# renormalized (see compute_score). `ai_leverage` has no weight yet
# since it isn't computed in v0.
DIMENSION_WEIGHTS = {
    "velocity": 0.20,
    "finishing": 0.20,
    "iteration": 0.15,
    "consistency": 0.10,
    "ambition": 0.15,
    "quality": 0.10,
    "efficiency": 0.10,
}

# Shipping Velocity = 100 / (1 + median_time_to_ship_days / VELOCITY_HALF_LIFE_DAYS)
# e.g. with 14: 3 days -> ~88, 14 days -> 50, 90 days -> ~13.
VELOCITY_HALF_LIFE_DAYS = 14

# Iteration = min(100, avg_releases_per_shipped_project * ITERATION_RELEASE_MULTIPLIER)
ITERATION_RELEASE_MULTIPLIER = 20

# Languages that bias the (placeholder) ambition score upward, on the
# assumption they more often show up in systems-y/harder projects.
# This is a crude proxy pending real architectural analysis.
AMBITIOUS_LANGUAGES = {
    "Rust", "Go", "C", "C++", "Elixir", "Erlang", "Scala", "Zig", "Haskell", "Kotlin",
}

AMBITION_LANGUAGE_BONUS = 20  # added per ambitious language present in the repo
AMBITION_DIVERSITY_CAP = 30  # max contribution from language count
AMBITION_DIVERSITY_PER_LANGUAGE = 6
AMBITION_SIZE_CAP = 50  # max contribution from repo size
AMBITION_SIZE_DIVISOR_KB = 200  # size_kb / this = size contribution
