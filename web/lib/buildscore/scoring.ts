// TypeScript port of src/buildscore/scoring.py.

import type { BuilderStats, BuilderVector, RepoClassification, RepoData } from "./models";
import {
  ACTIVENESS_GRAVEYARD_THRESHOLD,
  AMBITIOUS_LANGUAGES,
  AMBITION_DIVERSITY_CAP,
  AMBITION_DIVERSITY_PER_LANGUAGE,
  AMBITION_LANGUAGE_BONUS,
  AMBITION_SIZE_CAP,
  AMBITION_SIZE_DIVISOR_KB,
  DIMENSION_WEIGHTS,
  ITERATION_RELEASE_MULTIPLIER,
  VELOCITY_HALF_LIFE_DAYS,
} from "./variables";

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function computeStats(classifications: RepoClassification[]): BuilderStats {
  const meaningful = classifications.filter((c) => c.isMeaningful);
  const shipped = meaningful.filter((c) => c.repo.releases.length > 0);
  const dead = meaningful.filter((c) => c.activeness < ACTIVENESS_GRAVEYARD_THRESHOLD);

  const shipTimes = shipped
    .map((c) => c.timeToShipDays)
    .filter((t): t is number => t !== null);

  const dailyActive = new Set<string>();
  for (const c of meaningful) {
    for (const week of c.repo.weeklyCommitActivity) {
      const weekStart = new Date(week.week * 1000);
      week.days.forEach((count, dayOffset) => {
        if (count > 0) {
          const day = new Date(weekStart);
          day.setUTCDate(day.getUTCDate() + dayOffset);
          dailyActive.add(day.toISOString().slice(0, 10));
        }
      });
    }
  }

  const releasesPerShipped = shipped.map((c) => c.repo.releases.length);

  return {
    projectsStarted: classifications.length,
    meaningfulProjects: meaningful.length,
    shippedProjects: shipped.length,
    completionRate: meaningful.length ? shipped.length / meaningful.length : 0,
    graveyardRate: meaningful.length ? dead.length / meaningful.length : 0,
    medianTimeToShipDays: shipTimes.length ? median(shipTimes) : null,
    avgActiveness: meaningful.length ? mean(meaningful.map((c) => c.activeness)) : 0,
    longestStreakDays: longestStreak(dailyActive),
    avgReleasesPerShipped: releasesPerShipped.length ? mean(releasesPerShipped) : 0,
  };
}

function longestStreak(days: Set<string>): number {
  if (days.size === 0) return 0;
  const ordered = [...days].sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < ordered.length; i++) {
    const prev = new Date(ordered[i - 1]);
    const curr = new Date(ordered[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / 1000 / 86400;
    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

function repoAmbitionScore(repo: RepoData): number {
  const languages = Object.keys(repo.languages);
  const langBonus = languages.filter((lang) => AMBITIOUS_LANGUAGES.has(lang)).length *
    AMBITION_LANGUAGE_BONUS;
  const langDiversity = Math.min(AMBITION_DIVERSITY_CAP, languages.length * AMBITION_DIVERSITY_PER_LANGUAGE);
  const sizeScore = Math.min(AMBITION_SIZE_CAP, repo.sizeKb / AMBITION_SIZE_DIVISOR_KB);
  return Math.min(100, langBonus + langDiversity + sizeScore);
}

export function computeVector(
  stats: BuilderStats,
  classifications: RepoClassification[]
): BuilderVector {
  const meaningful = classifications.filter((c) => c.isMeaningful);

  const velocity =
    stats.medianTimeToShipDays !== null
      ? 100 / (1 + stats.medianTimeToShipDays / VELOCITY_HALF_LIFE_DAYS)
      : null;
  const finishing = stats.meaningfulProjects ? stats.completionRate * 100 : null;
  const iteration = stats.shippedProjects
    ? Math.min(100, stats.avgReleasesPerShipped * ITERATION_RELEASE_MULTIPLIER)
    : null;
  const consistency = stats.meaningfulProjects ? stats.avgActiveness : null;
  const ambition = meaningful.length
    ? mean(meaningful.map((c) => repoAmbitionScore(c.repo)))
    : null;

  return {
    velocity,
    finishing,
    iteration,
    consistency,
    ambition,
    quality: null,
    aiLeverage: null,
    efficiency: null,
  };
}

export function computeScore(vector: BuilderVector): number {
  const values: Record<string, number | null> = {
    velocity: vector.velocity,
    finishing: vector.finishing,
    iteration: vector.iteration,
    consistency: vector.consistency,
    ambition: vector.ambition,
    quality: vector.quality,
    efficiency: vector.efficiency,
  };
  const available = Object.entries(values).filter(
    (entry): entry is [string, number] => entry[1] !== null
  );
  if (available.length === 0) return 0;

  const weightSum = available.reduce((sum, [key]) => sum + DIMENSION_WEIGHTS[key], 0);
  const weighted = available.reduce((sum, [key, value]) => sum + DIMENSION_WEIGHTS[key] * value, 0);
  return weighted / weightSum;
}
