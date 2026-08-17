import { lt, sql } from "drizzle-orm";

import { db } from "./client";
import { rateLimitBuckets } from "./schema";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** Fixed-window per-key rate limit, backed by one atomic upsert (no
 * explicit transaction needed -- fits Neon's stateless HTTP driver). */
export async function checkAndIncrementRateLimit(
  key: string,
  windowSeconds: number,
  maxRequests: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs = Math.floor(now / (windowSeconds * 1000)) * (windowSeconds * 1000);
  const windowStart = new Date(windowStartMs);

  const [row] = await db
    .insert(rateLimitBuckets)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimitBuckets.key, rateLimitBuckets.windowStart],
      set: { count: sql`${rateLimitBuckets.count} + 1` },
    })
    .returning({ count: rateLimitBuckets.count });

  const retryAfterSeconds = Math.max(1, Math.ceil((windowStartMs + windowSeconds * 1000 - now) / 1000));

  if (row.count > maxRequests) {
    return { allowed: false, retryAfterSeconds };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Best-effort cleanup of old buckets. Call opportunistically (e.g. from a
 * small fraction of requests) -- low volume, not worth a cron job in v0. */
export async function pruneOldRateLimitBuckets(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db.delete(rateLimitBuckets).where(lt(rateLimitBuckets.windowStart, cutoff));
}
