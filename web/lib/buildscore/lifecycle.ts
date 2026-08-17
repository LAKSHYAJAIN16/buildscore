// TypeScript port of src/buildscore/lifecycle.py.

import type { RepoClassification, RepoData } from "./models";
import {
  ACTIVENESS_FREQUENCY_WEIGHT,
  ACTIVENESS_MAGNITUDE_WEIGHT,
  ACTIVENESS_RECENCY_WEIGHT,
  MAGNITUDE_REFERENCE_WEEKLY_CHURN,
  RECENCY_HALF_LIFE_DAYS,
  SMALL_REPO_SIZE_KB_THRESHOLD,
} from "./variables";

/** Cheap, zero-API-call gate using data already in the bulk repo listing --
 * decides whether a repo is worth spending the ~6 extra API calls on, or is
 * trivial/empty and can be scored 0 directly. */
export function isRepoWorthFullAnalysis(sizeKb: number, isFork: boolean): boolean {
  return !isFork && sizeKb > SMALL_REPO_SIZE_KB_THRESHOLD;
}

/** 0-100 continuous score blended from frequency, magnitude, and recency of
 * code churn across the repo's full history. Recency decays smoothly
 * (half-life) instead of cliffing into "abandoned" at some arbitrary day
 * count -- a project paused for months still scores proportionally, not
 * categorically. */
export function computeActiveness(codeFrequency: number[][], now: Date): number {
  if (codeFrequency.length === 0) return 0;

  const weeks = codeFrequency.map(
    (week) => [new Date(week[0] * 1000), week[1] + Math.abs(week[2])] as const
  );
  const activeWeeks = weeks.filter(([, churn]) => churn > 0);
  if (activeWeeks.length === 0) return 0;

  const frequencyScore = (100 * activeWeeks.length) / weeks.length;

  const churns = activeWeeks.map(([, churn]) => churn).sort((a, b) => a - b);
  const typicalChurn = churns[Math.floor(churns.length / 2)];
  const magnitudeScore =
    100 * Math.min(1, Math.log1p(typicalChurn) / Math.log1p(MAGNITUDE_REFERENCE_WEEKLY_CHURN));

  const lastActiveWeek = activeWeeks[activeWeeks.length - 1][0];
  const daysSinceActive = (now.getTime() - lastActiveWeek.getTime()) / 1000 / 86400;
  const recencyScore = 100 * Math.pow(0.5, daysSinceActive / RECENCY_HALF_LIFE_DAYS);

  return (
    frequencyScore * ACTIVENESS_FREQUENCY_WEIGHT +
    magnitudeScore * ACTIVENESS_MAGNITUDE_WEIGHT +
    recencyScore * ACTIVENESS_RECENCY_WEIGHT
  );
}

export function classifyRepo(repo: RepoData, now: Date): RepoClassification {
  const isMeaningful = isRepoWorthFullAnalysis(repo.sizeKb, repo.isFork);

  const shipDate = repo.releases.length > 0 ? repo.releases[0].publishedAt : null;
  const timeToShipDays = shipDate
    ? (shipDate.getTime() - repo.createdAt.getTime()) / 1000 / 86400
    : null;

  const activeness = isMeaningful ? computeActiveness(repo.codeFrequency, now) : 0;

  return {
    repo,
    activeness,
    isMeaningful,
    shipDate,
    timeToShipDays,
  };
}
