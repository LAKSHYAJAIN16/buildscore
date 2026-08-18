import { pgTable, text, integer, boolean, timestamp, jsonb, primaryKey, serial } from "drizzle-orm/pg-core";

// Per-repo cache, keyed by full_name ("owner/repo", lowercased). On a
// rescan, if the freshly-listed repo's pushedAt matches this row's, we
// reuse the cached sub-resources and skip the ~4 GitHub calls for it.
export const reposCache = pgTable("repos_cache", {
  fullName: text("full_name").primaryKey(),
  owner: text("owner").notNull(),
  name: text("name").notNull(),
  pushedAt: timestamp("pushed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  isFork: boolean("is_fork").notNull(),
  isArchived: boolean("is_archived").notNull(),
  sizeKb: integer("size_kb").notNull(),
  stargazersCount: integer("stargazers_count").notNull(),
  languages: jsonb("languages").notNull().$type<Record<string, number>>(),
  releases: jsonb("releases").notNull().$type<{ publishedAt: string | null }[]>(),
  weeklyCommitActivity: jsonb("weekly_commit_activity")
    .notNull()
    .$type<{ days: number[]; total: number; week: number }[]>(),
  codeFrequency: jsonb("code_frequency").notNull().$type<number[][]>(),
  // Root-listing + recent commit messages, shared by the quality and
  // AI-leverage heuristics. Cached alongside everything else so a cache hit
  // (pushedAt unchanged) doesn't silently lose these dimensions.
  rootEntries: jsonb("root_entries").notNull().$type<string[]>(),
  recentCommitMessages: jsonb("recent_commit_messages").notNull().$type<string[]>(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ScanStatus = "pending" | "in_progress" | "completed" | "failed";

// One row per username. Doubles as the TTL result cache (status=completed,
// unexpired) and the dedup lock (status=pending/in_progress).
export const userScores = pgTable("user_scores", {
  username: text("username").primaryKey(),
  status: text("status").notNull().$type<ScanStatus>(),
  result: jsonb("result"),
  error: text("error"),
  repoListingSnapshot: jsonb("repo_listing_snapshot"),
  progress: jsonb("progress").$type<{ processedIndex: number; total: number } | null>(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

// Fixed-window per-IP rate limiting. Composite PK means a repeat hit in the
// same window is a plain increment, not a new row.
export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
  },
  (t) => ({ pk: primaryKey({ columns: [t.key, t.windowStart] }) })
);

// Replaces security.py's local ~/.buildscore/rate_limit_state.json file,
// which doesn't work across stateless serverless invocations.
export const githubTokenUsageState = pgTable("github_token_usage_state", {
  tokenFingerprint: text("token_fingerprint").primaryKey(),
  remaining: integer("remaining").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

// Microgrants applications. No review-workflow columns (status, reviewer
// notes, etc.) on purpose -- v0's review path is reading this table
// directly (Neon's own console), not a built admin UI. buildscoreAtApply is
// a snapshot, not a live join to user_scores: eligibility was already
// enforced server-side at submission time, and a snapshot survives the
// applicant's user_scores row later expiring or being overwritten by a
// rescan.
export const grantApplications = pgTable("grant_applications", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  projectName: text("project_name").notNull(),
  pitch: text("pitch").notNull(),
  email: text("email").notNull(),
  buildscoreAtApply: integer("buildscore_at_apply").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
