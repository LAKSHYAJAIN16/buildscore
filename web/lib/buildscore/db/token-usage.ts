import { sql } from "drizzle-orm";

import { db } from "./client";
import { githubTokenUsageState } from "./schema";

export interface TokenUsageSnapshot {
  fingerprint: string;
  remaining: number;
  resetAt: Date;
}

export interface PreviousTokenUsage {
  remaining: number;
  resetAt: Date;
}

/** Records the latest observed remaining/reset for a token and returns
 * whatever was recorded immediately before this write (or null on first
 * observation). One atomic upsert -- see security.ts for how the caller
 * turns this into a drift signal. */
export async function recordTokenUsage(
  snapshot: TokenUsageSnapshot
): Promise<PreviousTokenUsage | null> {
  const rows = await db.execute<{ prev_remaining: number | null; prev_reset_at: string | null }>(sql`
    WITH prev AS (
      SELECT remaining, reset_at FROM ${githubTokenUsageState}
      WHERE token_fingerprint = ${snapshot.fingerprint}
    )
    INSERT INTO ${githubTokenUsageState} (token_fingerprint, remaining, reset_at, recorded_at)
    VALUES (${snapshot.fingerprint}, ${snapshot.remaining}, ${snapshot.resetAt.toISOString()}, now())
    ON CONFLICT (token_fingerprint) DO UPDATE SET
      remaining = excluded.remaining,
      reset_at = excluded.reset_at,
      recorded_at = now()
    RETURNING
      (SELECT remaining FROM prev) AS prev_remaining,
      (SELECT reset_at FROM prev) AS prev_reset_at
  `);

  const row = rows.rows[0];
  if (!row || row.prev_remaining === null || row.prev_reset_at === null) return null;
  return { remaining: row.prev_remaining, resetAt: new Date(row.prev_reset_at) };
}
