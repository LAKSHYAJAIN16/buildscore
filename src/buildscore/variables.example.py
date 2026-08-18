"""Tunable thresholds and weights for the Buildscore heuristics.

Every value here is a judgment call, not a derived constant. Centralized
so they're easy to find and retune without digging through the pipeline
code (lifecycle.py, scoring.py, github_client.py, security.py, cli.py
all import from here instead of defining their own).

This is the committed template. Copy it to variables.py (gitignored) and
tune freely -- keeping the exact thresholds out of the public repo raises
the bar against gaming the score (same reasoning as the "Anti-Gaming"
section of the original design doc, docs/VISION.md).
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

# Transient transport failures (DNS resolution hiccups, dropped
# connections) observed in practice on long scans with many sequential
# requests -- retried separately from the 202-polling loop above.
TRANSPORT_ERROR_MAX_RETRIES = 3
TRANSPORT_ERROR_RETRY_BACKOFF_SECONDS = 2

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
# renormalized (see compute_score). `efficiency` has no meaningful
# signal yet (needs the semantic-diff pipeline) and stays unweighted
# in spirit even though it carries a nominal weight below -- it's
# always None so compute_score always renormalizes it away.
DIMENSION_WEIGHTS = {
    "velocity": 0.18,
    "finishing": 0.18,
    "iteration": 0.12,
    "consistency": 0.10,
    "ambition": 0.12,
    "quality": 0.10,
    "ai_leverage": 0.10,
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

# --- Quality (scoring.py) ---
#
# v0 heuristic, not real code review: blends repo-structure signals
# (tests/CI/license presence, from one root contents() call already
# shared with the AI-leverage check below) with churn stability (steady
# week-to-week work vs. erratic spikes, from code_frequency -- already
# fetched for activeness, zero extra cost).

QUALITY_TEST_DIR_NAMES = {"tests", "test", "__tests__", "spec"}
QUALITY_CI_INDICATORS = {".github", ".gitlab-ci.yml", ".circleci", "azure-pipelines.yml"}
QUALITY_LICENSE_NAMES = {"LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING"}

QUALITY_STRUCTURE_WEIGHT = 0.6
QUALITY_STABILITY_WEIGHT = 0.4
QUALITY_STRUCTURE_TEST_POINTS = 45
QUALITY_STRUCTURE_CI_POINTS = 35
QUALITY_STRUCTURE_LICENSE_POINTS = 20

# Coefficient of variation (population stddev / mean) of weekly churn at
# or above this is treated as maximally erratic -- stability score
# floors at 0 rather than going negative.
QUALITY_STABILITY_CV_CEILING = 2.0

# --- AI Leverage (scoring.py) ---
#
# v0 heuristic: presence of known AI coding-tool config/rule files
# (same root contents() call as quality's structure check, zero extra
# cost) blended with the fraction of recently sampled commits carrying
# an AI co-authorship signal. Deliberately NOT "generated-code survival
# after N days" -- that needs blame-diffing over time and is real
# semantic-analysis territory (phase 2), not a v0 heuristic.

AI_CONFIG_FILENAMES = {"AGENTS.md", "CLAUDE.md", ".cursorrules", ".windsurfrules", ".aider.conf.yml"}
AI_COMMIT_SAMPLE_SIZE = 50  # most recent commits sampled per repo, one API call
AI_LEVERAGE_CONFIG_POINTS = 40  # flat bonus if any AI config file is present
AI_LEVERAGE_COMMIT_WEIGHT = 60  # scaled by fraction of sampled commits with an AI signal

# --- ACID repo analysis (acid.py) ---
#
# LLM-based per-repo analysis -- our version of what GitRoll calls ACID
# (Architecture, Cross-Domain, Innovation, Documentation). Genuinely
# optional: requires ANTHROPIC_API_KEY. Without it, ambition silently falls
# back to the old language/size heuristic (_repo_ambition_score's original
# behavior) -- this is the one part of the pipeline with a real per-scan
# cost, so it must never be a hard requirement for the CLI to work.

ACID_MODEL = "claude-haiku-4-5-20251001"
ACID_MAX_OUTPUT_TOKENS = 400
# READMEs are truncated before being sent to the LLM -- bounds both cost and
# the chance of prompt injection from an untrusted README having enough
# room to do anything sophisticated.
ACID_README_MAX_CHARS = 4000
# Ambition = this fraction from the ACID sub-scores (Architecture,
# Cross-Domain, Innovation; Documentation feeds Quality instead, see
# scoring.py) blended with the pre-existing language/size heuristic, when
# both are available. When ACID isn't available, ambition is 100% the
# heuristic, unchanged from before.
ACID_AMBITION_BLEND_WEIGHT = 0.7
# Documentation sub-score's contribution to Quality's structure score,
# alongside tests/CI/license presence -- see QUALITY_STRUCTURE_* above.
ACID_QUALITY_DOCUMENTATION_POINTS = 25

# --- Score tier (cli.py) ---
#
# A letter-tier bucket of the absolute 0-100 score, display-only (cosmetic,
# like ACTIVENESS_LABEL_* -- never used in scoring math). Deliberately does
# NOT claim a percentile ("top X% of people") -- that needs a real
# population of scanned users to compare against, which doesn't exist yet.
# These cutoffs are our own judgment call, not copied from any competitor's
# specific thresholds.
SCORE_TIER_S_PLUS = 90
SCORE_TIER_S = 75
SCORE_TIER_A = 60
SCORE_TIER_B = 45
# below SCORE_TIER_B is tier "C"

# --- Notable contributions (cli.py) ---
#
# External repos (not owned by the scanned user) they have at least one
# merged PR in -- GitHub Search API only, no cloning. Display-only social
# proof, not used in scoring math (unlike GitRoll, we don't fold this into
# the Influence-style dimension yet -- see conversation_history.md).

# How many of the user's most recent merged PRs to scan (one Search API
# call, capped well under its 30/min limit regardless of this value).
NOTABLE_CONTRIBUTIONS_SEARCH_LIMIT = 100
# How many distinct external repos to show, ranked by merged PR count.
# Each one costs one extra core API call (for its star count) -- keep this
# small.
NOTABLE_CONTRIBUTIONS_TOP_N = 5
