import { db } from "../buildscore/db/client";
import { getUserScore } from "../buildscore/db/user-scores";
import { grantApplications } from "../buildscore/db/schema";
import { MIN_BUILDSCORE_THRESHOLD } from "./data";

export type EligibilityResult =
  | { eligible: true; score: number }
  | { eligible: false; reason: "no_score"; score: null }
  | { eligible: false; reason: "below_threshold"; score: number };

/** Reuses the existing scan pipeline's stored result rather than triggering
 * a new scan synchronously inside a form submission -- applicants need to
 * have already been scored (via the normal home-page flow) before they can
 * apply. No live join to user_scores after this point: the caller should
 * snapshot the returned score into the application row, since user_scores
 * can later expire (TTL) or change (rescan) independent of what actually
 * qualified this application. */
export async function checkEligibility(username: string): Promise<EligibilityResult> {
  const row = await getUserScore(username);
  if (!row || row.status !== "completed" || row.result === null) {
    return { eligible: false, reason: "no_score", score: null };
  }
  const score = (row.result as { score?: unknown }).score;
  if (typeof score !== "number") {
    return { eligible: false, reason: "no_score", score: null };
  }
  if (score < MIN_BUILDSCORE_THRESHOLD) {
    return { eligible: false, reason: "below_threshold", score };
  }
  return { eligible: true, score };
}

export interface GrantApplicationInput {
  username: string;
  projectName: string;
  pitch: string;
  email: string;
  buildscoreAtApply: number;
}

export async function insertGrantApplication(input: GrantApplicationInput): Promise<void> {
  await db.insert(grantApplications).values(input);
}
