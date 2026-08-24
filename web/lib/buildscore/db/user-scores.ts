import { eq, sql } from "drizzle-orm";

import { db } from "./client";
import { userScores, type ScanStatus } from "./schema";
import type { RawGithubRepo } from "../models";
import { SCAN_STALE_IN_PROGRESS_MINUTES, USER_SCORE_TTL_HOURS } from "../variables";

export interface UserScoreRow {
  username: string;
  status: ScanStatus;
  result: unknown;
  error: string | null;
  repoListingSnapshot: RawGithubRepo[] | null;
  progress: { processedIndex: number; total: number } | null;
  requestedAt: Date;
  generatedAt: Date | null;
  updatedAt: Date;
  expiresAt: Date | null;
}

export type ClaimResult =
  | { kind: "claimed" }
  | { kind: "fresh_cached"; row: UserScoreRow }
  | { kind: "already_running"; status: ScanStatus };

/**
 * One atomic upsert that is simultaneously the TTL cache check and the
 * dedup lock: it claims the scan (resetting the row to `pending`) UNLESS a
 * fresh `completed` result exists or another scan is already
 * pending/actively `in_progress`, in which case it returns zero rows and we
 * fall back to a plain read to decide which case we're in.
 */
export async function claimScanSlot(username: string): Promise<ClaimResult> {
  const rows = await db.execute<{
    username: string;
    status: ScanStatus;
    result: unknown;
    error: string | null;
    repo_listing_snapshot: RawGithubRepo[] | null;
    progress: { processedIndex: number; total: number } | null;
    requested_at: string;
    generated_at: string | null;
    updated_at: string;
    expires_at: string | null;
  }>(sql`
    INSERT INTO user_scores (
      username, status, requested_at, updated_at,
      repo_listing_snapshot, progress, result, error
    )
    VALUES (${username}, 'pending', now(), now(), NULL, NULL, NULL, NULL)
    ON CONFLICT (username) DO UPDATE SET
      status = 'pending', requested_at = now(), updated_at = now(),
      repo_listing_snapshot = NULL, progress = NULL, result = NULL, error = NULL
    WHERE
      user_scores.status = 'failed'
      OR (user_scores.status = 'completed' AND (user_scores.expires_at IS NULL OR user_scores.expires_at < now()))
      OR (user_scores.status = 'in_progress' AND user_scores.updated_at < now() - interval '${sql.raw(String(SCAN_STALE_IN_PROGRESS_MINUTES))} minutes')
    RETURNING *
  `);

  if (rows.rows.length > 0) {
    return { kind: "claimed" };
  }

  const [row] = await db.select().from(userScores).where(eq(userScores.username, username)).limit(1);
  if (!row) {
    // Extremely unlikely race (row vanished between the upsert attempt and
    // this read) -- treat as claimable by the next request.
    return { kind: "claimed" };
  }
  if (row.status === "completed") {
    return { kind: "fresh_cached", row: toUserScoreRow(row) };
  }
  return { kind: "already_running", status: row.status };
}

export async function getUserScore(username: string): Promise<UserScoreRow | null> {
  const [row] = await db.select().from(userScores).where(eq(userScores.username, username)).limit(1);
  return row ? toUserScoreRow(row) : null;
}

/** First chunk of a scan attempt: records the fixed-order repo list every
 * later chunk walks, and flips pending -> in_progress. */
export async function updateScanSnapshot(username: string, snapshot: RawGithubRepo[]): Promise<void> {
  await db
    .update(userScores)
    .set({ status: "in_progress", repoListingSnapshot: snapshot, updatedAt: new Date() })
    .where(eq(userScores.username, username));
}

export async function updateScanProgress(
  username: string,
  progress: { processedIndex: number; total: number }
): Promise<void> {
  await db
    .update(userScores)
    .set({ progress, updatedAt: new Date() })
    .where(eq(userScores.username, username));
}

export async function markCompleted(username: string, result: unknown): Promise<void> {
  const now = new Date();
  await db
    .update(userScores)
    .set({
      status: "completed",
      result,
      error: null,
      generatedAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + USER_SCORE_TTL_HOURS * 60 * 60 * 1000),
    })
    .where(eq(userScores.username, username));
}

export async function markFailed(username: string, error: string): Promise<void> {
  await db
    .update(userScores)
    .set({ status: "failed", error, updatedAt: new Date() })
    .where(eq(userScores.username, username));
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  generatedAt: Date;
}

/** Every completed scan, ranked by score desc, for the public /leaderboard
 * directory. Reads straight off the jsonb `result.score` rather than adding
 * a dedicated column -- this table is small enough (one row per scanned
 * user) that indexing it isn't worth the migration yet. */
export async function getLeaderboard(limit: number, offset: number): Promise<LeaderboardEntry[]> {
  const rows = await db.execute<{ username: string; score: string; generated_at: string }>(sql`
    SELECT username, result->>'score' AS score, generated_at
    FROM user_scores
    WHERE status = 'completed' AND result IS NOT NULL
    ORDER BY (result->>'score')::numeric DESC
    LIMIT ${limit} OFFSET ${offset}
  `);
  return rows.rows.map((r) => ({
    username: r.username,
    score: Number(r.score),
    generatedAt: new Date(r.generated_at),
  }));
}

export async function getLeaderboardCount(): Promise<number> {
  const rows = await db.execute<{ count: string }>(sql`
    SELECT count(*)::text AS count FROM user_scores WHERE status = 'completed' AND result IS NOT NULL
  `);
  return Number(rows.rows[0]?.count ?? 0);
}

/** Percentile of `score` among every other completed scan (0-100, rounded;
 * 100 means nobody else scored higher). Only meaningful once a real
 * population exists -- returns null with fewer than 2 other completed rows
 * to score against, rather than a misleading "100th percentile of one." */
export async function getPercentile(username: string, score: number): Promise<number | null> {
  const rows = await db.execute<{ total: string; lower_or_equal: string }>(sql`
    SELECT
      count(*) FILTER (WHERE username != ${username})::text AS total,
      count(*) FILTER (WHERE username != ${username} AND (result->>'score')::numeric <= ${score})::text AS lower_or_equal
    FROM user_scores
    WHERE status = 'completed' AND result IS NOT NULL
  `);
  const total = Number(rows.rows[0]?.total ?? 0);
  const lowerOrEqual = Number(rows.rows[0]?.lower_or_equal ?? 0);
  if (total < 2) return null;
  return Math.round((lowerOrEqual / total) * 100);
}

function toUserScoreRow(row: typeof userScores.$inferSelect): UserScoreRow {
  return {
    username: row.username,
    status: row.status,
    result: row.result,
    error: row.error,
    repoListingSnapshot: row.repoListingSnapshot as RawGithubRepo[] | null,
    progress: row.progress,
    requestedAt: row.requestedAt,
    generatedAt: row.generatedAt,
    updatedAt: row.updatedAt,
    expiresAt: row.expiresAt,
  };
}
