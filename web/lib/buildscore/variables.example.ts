/**
 * Tunable thresholds and weights for the Buildscore heuristics.
 *
 * Every value here is a judgment call, not a derived constant. Centralized
 * so they're easy to find and retune without digging through the pipeline
 * code (pipeline.ts, github-client.ts, security.ts, api/scan/* all import
 * from here instead of defining their own).
 *
 * This is the committed template. Copy it to variables.ts (gitignored) and
 * tune freely -- keeping the exact thresholds out of the public repo raises
 * the bar against gaming the score (same reasoning as the "Anti-Gaming"
 * section of the original design doc, and the same split src/buildscore's
 * variables.py/variables.example.py already use).
 */

// --- Repo tiering / resource budget ---

// Repos at or below this size in KB (from the bulk repo listing -- free, no
// extra API call) skip the full per-repo pipeline (releases, languages,
// commit_activity, code_frequency) entirely and are scored as trivial/empty
// without spending API calls on them.
export const SMALL_REPO_SIZE_KB_THRESHOLD = 50;

// --- GitHub API client (github-client.ts) ---

// Stop making calls once remaining quota drops below this, rather than
// letting GitHub 403 us mid-scan.
export const RATE_LIMIT_SAFETY_MARGIN = 20;

// GitHub computes /stats/* endpoints asynchronously per repo and returns 202
// until the cache is warm. On a cold cache this can genuinely take 30-60s+,
// especially when many repos are queued back-to-back. Once warm, GitHub
// caches the result, so this cost is effectively one-time per repo. Retries
// here cost wall-clock time, not meaningful rate-limit budget -- don't cut
// this to "save resources"; the actual rate-limit safeguard is
// RATE_LIMIT_SAFETY_MARGIN.
export const STATS_MAX_RETRIES = 8;
export const STATS_RETRY_BACKOFF_SECONDS = 2;

// --- Security / suspicious usage detection (security.ts) ---

// Allowed slack (in API calls) between expected and actual remaining quota
// before flagging possible concurrent token usage. On the web, many scans
// legitimately run concurrently against the same shared token, so this is
// checked only when no other scan is in_progress -- see security.ts.
export const DRIFT_TOLERANCE = 5;

// --- Activeness score (lifecycle.ts) ---
//
// Continuous 0-100 score blended from three signals computed off the repo's
// full commit history (via stats/code_frequency, which -- unlike
// stats/commit_activity -- isn't limited to the trailing 52 weeks): how
// often work happens, how substantial it is, and how recently it happened
// (smoothly decayed, not a hard cutoff).

export const ACTIVENESS_FREQUENCY_WEIGHT = 0.35;
export const ACTIVENESS_MAGNITUDE_WEIGHT = 0.25;
export const ACTIVENESS_RECENCY_WEIGHT = 0.4;

// Weekly code churn (additions + deletions) treated as "a full week of solid
// work" for magnitude scoring; log-scaled so one huge commit (vendored code,
// a big refactor) doesn't dominate the score.
export const MAGNITUDE_REFERENCE_WEEKLY_CHURN = 400;

// Recency decays by half every RECENCY_HALF_LIFE_DAYS since the last active
// week, instead of falling off a cliff at some day count.
export const RECENCY_HALF_LIFE_DAYS = 120;

// Below this activeness score, a meaningful repo counts toward graveyard_rate.
export const ACTIVENESS_GRAVEYARD_THRESHOLD = 15;

// Display-only buckets for human-readable labels. Cosmetic only -- never
// used in scoring math.
export const ACTIVENESS_LABEL_THRIVING = 70;
export const ACTIVENESS_LABEL_ACTIVE = 40;
export const ACTIVENESS_LABEL_COOLING = 15;

// --- Scoring (scoring.ts) ---

// Weighted contribution of each Builder Vector dimension to the final
// score. Dimensions with no computed value are excluded and the rest
// renormalized (see computeScore). ai_leverage has no weight yet since it
// isn't computed in v0 -- matches the Python DIMENSION_WEIGHTS exactly.
export const DIMENSION_WEIGHTS: Record<string, number> = {
  velocity: 0.2,
  finishing: 0.2,
  iteration: 0.15,
  consistency: 0.1,
  ambition: 0.15,
  quality: 0.1,
  efficiency: 0.1,
};

// Shipping Velocity = 100 / (1 + medianTimeToShipDays / VELOCITY_HALF_LIFE_DAYS)
// e.g. with 14: 3 days -> ~88, 14 days -> 50, 90 days -> ~13.
export const VELOCITY_HALF_LIFE_DAYS = 14;

// Iteration = min(100, avgReleasesPerShipped * ITERATION_RELEASE_MULTIPLIER)
export const ITERATION_RELEASE_MULTIPLIER = 20;

// Languages that bias the (placeholder) ambition score upward, on the
// assumption they more often show up in systems-y/harder projects. This is
// a crude proxy pending real architectural analysis.
export const AMBITIOUS_LANGUAGES = new Set([
  "Rust",
  "Go",
  "C",
  "C++",
  "Elixir",
  "Erlang",
  "Scala",
  "Zig",
  "Haskell",
  "Kotlin",
]);

export const AMBITION_LANGUAGE_BONUS = 20; // added per ambitious language present in the repo
export const AMBITION_DIVERSITY_CAP = 30; // max contribution from language count
export const AMBITION_DIVERSITY_PER_LANGUAGE = 6;
export const AMBITION_SIZE_CAP = 50; // max contribution from repo size
export const AMBITION_SIZE_DIVISOR_KB = 200; // size_kb / this = size contribution

// --- Web-only: scan orchestration (pipeline.ts, api/scan/*) ---
//
// The CLI runs one scan at a time, synchronously, with no duration limit.
// The web version runs on Vercel functions, which do have a duration
// ceiling, and many visitors' scans run concurrently against one shared
// GITHUB_TOKEN -- these constants exist only for that environment.

// Tighter than the CLI's DEFAULT_MAX_REPOS=1000; bounds the worst-case
// number of chunks a single scan can take. Tune against your Vercel plan's
// actual maxDuration.
export const SCAN_MAX_REPOS = 150;

// How long one worker invocation processes repos before self-continuing via
// POST /api/scan/worker, leaving headroom under the route's maxDuration.
export const SCAN_CHUNK_TIME_BUDGET_MS = 40_000;

// How many repos to fetch concurrently within a chunk. Also used as the
// concurrency for a single repo's own 4 sub-resource calls.
export const CONCURRENT_REPO_FETCHES = 4;

// Per-IP rate limit on POST /api/scan (the expensive, mutating endpoint).
export const RATE_LIMIT_SCAN_MAX_REQUESTS = 5;
export const RATE_LIMIT_SCAN_WINDOW_SECONDS = 600;

// Per-IP rate limit on GET /api/scan/[username] (cheap read-only polling).
export const RATE_LIMIT_POLL_MAX_REQUESTS = 60;
export const RATE_LIMIT_POLL_WINDOW_SECONDS = 60;

// How long a completed user_scores row is served from cache before a fresh
// scan is triggered again.
export const USER_SCORE_TTL_HOURS = 18;

// An in_progress scan whose last progress update is older than this is
// considered crashed/abandoned and can be reclaimed by a new request.
export const SCAN_STALE_IN_PROGRESS_MINUTES = 10;

// Safety cap against a runaway self-continuation chain (e.g. a bug that
// never converges) -- a scan older than this is force-failed.
export const SCAN_ABSOLUTE_TIMEOUT_MINUTES = 20;
