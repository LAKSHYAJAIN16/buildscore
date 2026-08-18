// TypeScript port of src/buildscore/scoring.py.

import type { BuilderStats, BuilderVector, RepoClassification, RepoData } from "./models";
import {
  ACID_AMBITION_BLEND_WEIGHT,
  ACID_QUALITY_DOCUMENTATION_POINTS,
  ACTIVENESS_GRAVEYARD_THRESHOLD,
  AI_CONFIG_FILENAMES,
  AI_LEVERAGE_COMMIT_WEIGHT,
  AI_LEVERAGE_CONFIG_POINTS,
  AMBITIOUS_LANGUAGES,
  AMBITION_DIVERSITY_CAP,
  AMBITION_DIVERSITY_PER_LANGUAGE,
  AMBITION_LANGUAGE_BONUS,
  AMBITION_SIZE_CAP,
  AMBITION_SIZE_DIVISOR_KB,
  DIMENSION_WEIGHTS,
  ITERATION_RELEASE_MULTIPLIER,
  QUALITY_CI_INDICATORS,
  QUALITY_LICENSE_NAMES,
  QUALITY_STABILITY_CV_CEILING,
  QUALITY_STABILITY_WEIGHT,
  QUALITY_STRUCTURE_CI_POINTS,
  QUALITY_STRUCTURE_LICENSE_POINTS,
  QUALITY_STRUCTURE_TEST_POINTS,
  QUALITY_STRUCTURE_WEIGHT,
  QUALITY_TEST_DIR_NAMES,
  VELOCITY_HALF_LIFE_DAYS,
} from "./variables";

function hasAny(entries: string[], set: Set<string>): boolean {
  return entries.some((e) => set.has(e));
}

function populationStdev(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

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
  const heuristicScore = Math.min(100, langBonus + langDiversity + sizeScore);

  if (!repo.acid) return heuristicScore;

  // ACID's Architecture/Cross-Domain/Innovation sub-scores are real
  // content-informed judgment (see acid.ts) -- when available, they
  // dominate the blend; the old language/size heuristic still contributes
  // so one LLM call can't single-handedly swing the score to an extreme.
  const acidComponent =
    (mean([repo.acid.architecture, repo.acid.crossDomain, repo.acid.innovation]) / 5) * 100;
  return ACID_AMBITION_BLEND_WEIGHT * acidComponent + (1 - ACID_AMBITION_BLEND_WEIGHT) * heuristicScore;
}

// 100 for dead-steady week-to-week churn, decaying toward 0 as the
// coefficient of variation grows -- erratic spikes (one huge commit, long
// silences) score lower than a consistent trickle of work, even at the same
// total volume.
function churnStabilityScore(codeFrequency: number[][]): number {
  const churns = codeFrequency.map(([, additions, deletions]) => additions + Math.abs(deletions));
  const active = churns.filter((c) => c > 0);
  if (active.length < 2) return 50; // not enough signal to call it stable or erratic

  const m = mean(active);
  if (m === 0) return 50;

  const cv = populationStdev(active) / m;
  return 100 * Math.max(0, 1 - Math.min(cv, QUALITY_STABILITY_CV_CEILING) / QUALITY_STABILITY_CV_CEILING);
}

function repoQualityScore(repo: RepoData): number {
  let structurePoints =
    (hasAny(repo.rootEntries, QUALITY_TEST_DIR_NAMES) ? QUALITY_STRUCTURE_TEST_POINTS : 0) +
    (hasAny(repo.rootEntries, QUALITY_CI_INDICATORS) ? QUALITY_STRUCTURE_CI_POINTS : 0) +
    (hasAny(repo.rootEntries, QUALITY_LICENSE_NAMES) ? QUALITY_STRUCTURE_LICENSE_POINTS : 0);
  if (repo.acid) {
    // ACID's Documentation sub-score is a real read of the README's
    // quality, not just "does one exist" -- a graded contribution rather
    // than the flat presence bonuses above.
    structurePoints += (repo.acid.documentation / 5) * ACID_QUALITY_DOCUMENTATION_POINTS;
  }
  const structureScore = Math.min(100, structurePoints);
  const stabilityScore = churnStabilityScore(repo.codeFrequency);

  return structureScore * QUALITY_STRUCTURE_WEIGHT + stabilityScore * QUALITY_STABILITY_WEIGHT;
}

const AI_COMMIT_PATTERN =
  /co-authored-by:\s*.*(claude|copilot|chatgpt|gpt-4|cursor|codeium|devin|windsurf)/i;

function repoAiLeverageScore(repo: RepoData): number {
  const hasAiConfig = hasAny(repo.rootEntries, AI_CONFIG_FILENAMES);
  const configPoints = hasAiConfig ? AI_LEVERAGE_CONFIG_POINTS : 0;

  const messages = repo.recentCommitMessages;
  const aiCommitFraction = messages.length
    ? messages.filter((m) => AI_COMMIT_PATTERN.test(m)).length / messages.length
    : 0;
  const commitPoints = AI_LEVERAGE_COMMIT_WEIGHT * aiCommitFraction;

  return Math.min(100, configPoints + commitPoints);
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
  const quality = meaningful.length
    ? mean(meaningful.map((c) => repoQualityScore(c.repo)))
    : null;
  const aiLeverage = meaningful.length
    ? mean(meaningful.map((c) => repoAiLeverageScore(c.repo)))
    : null;

  return {
    velocity,
    finishing,
    iteration,
    consistency,
    ambition,
    quality,
    aiLeverage,
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
    aiLeverage: vector.aiLeverage,
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
