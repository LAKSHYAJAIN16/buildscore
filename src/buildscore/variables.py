"""Tunable thresholds and weights for the Buildscore heuristics.

Every value here is a judgment call, not a derived constant. Centralized
so they're easy to find and retune without digging through the pipeline
code (lifecycle.py, scoring.py, github_client.py, security.py, cli.py
all import from here instead of defining their own).
"""

from __future__ import annotations

# --- Lifecycle classification (lifecycle.py) ---

# A repo needs at least this many commits (in the trailing 52 weeks --
# see README's "Known limitations": GitHub's stats endpoint doesn't
# cover anything older) to be considered a real project rather than noise.
MIN_COMMITS_FOR_MEANINGFUL = 3

# Repo counts as "active" if last pushed within this many days.
ACTIVE_DAYS = 60

# Repo counts as "dormant" (not yet abandoned) if last pushed within
# this many days but past ACTIVE_DAYS.
STALE_DAYS = 180

# --- GitHub API client (github_client.py) ---

# Stop making calls once remaining quota drops below this, rather than
# letting GitHub 403 us mid-run.
RATE_LIMIT_SAFETY_MARGIN = 20

# --- Security / suspicious usage detection (security.py) ---

# Allowed slack (in API calls) between expected and actual remaining
# quota before flagging possible concurrent token usage.
DRIFT_TOLERANCE = 5

# --- CLI defaults (cli.py) ---

DEFAULT_MAX_REPOS = 50

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
