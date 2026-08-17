// Redesigned port of src/buildscore/security.py's check_for_suspicious_drift.
//
// The Python version assumes one sequential CLI process at a time, so
// "expected remaining = previous remaining - this run's calls" is a
// meaningful leak signal, persisted to a local JSON file. Neither
// assumption holds here: many scans legitimately run concurrently against
// the same shared GITHUB_TOKEN on Vercel, and there's no persistent local
// disk across invocations.
//
// v0 approach: record the latest observed remaining/reset via one atomic DB
// upsert (token-usage.ts) as an observability log. Only surface a warning
// -- server-log only, never shown to end users -- when no other scan is
// currently in_progress (so we can be reasonably sure buildscore itself
// wasn't the source of the extra usage) and the drift still exceeds
// DRIFT_TOLERANCE. This is explicitly best-effort/advisory, not a
// guarantee; precise concurrent-usage attribution is out of scope for v0.

import { createHash } from "node:crypto";
import { count, eq } from "drizzle-orm";

import { db } from "./db/client";
import { userScores } from "./db/schema";
import { recordTokenUsage } from "./db/token-usage";
import type { GitHubClient } from "./github-client";
import { DRIFT_TOLERANCE } from "./variables";

function tokenFingerprint(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}

export async function checkForSuspiciousDrift(client: GitHubClient): Promise<void> {
  if (client.rateLimitRemaining === null || client.rateLimitReset === null) return;

  const fingerprint = tokenFingerprint(client.token);
  const previous = await recordTokenUsage({
    fingerprint,
    remaining: client.rateLimitRemaining,
    resetAt: client.rateLimitReset,
  });
  if (!previous) return;
  if (previous.resetAt.getTime() !== client.rateLimitReset.getTime()) return; // quota window rolled over

  const expectedRemaining = previous.remaining - client.callsMade;
  const drift = expectedRemaining - client.rateLimitRemaining;
  if (drift <= DRIFT_TOLERANCE) return;

  const [{ inProgressCount }] = await db
    .select({ inProgressCount: count() })
    .from(userScores)
    .where(eq(userScores.status, "in_progress"));

  if (inProgressCount > 0) {
    // Other legitimate concurrent scans fully explain unattributed usage --
    // not a reliable signal either way, stay quiet.
    return;
  }

  console.warn(
    `[buildscore] Possible unexpected GitHub token usage: ${drift} more API calls were made ` +
      "against this token than the current scan accounts for, with no other scan in progress. " +
      "If unexpected, consider revoking it at https://github.com/settings/tokens."
  );
}
