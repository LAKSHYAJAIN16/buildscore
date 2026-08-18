// Port of cli.py's _serialize / _activeness_label — the API's JSON response shape.

import type { BuildscoreResult } from "./models";
import {
  ACTIVENESS_LABEL_ACTIVE,
  ACTIVENESS_LABEL_COOLING,
  ACTIVENESS_LABEL_THRIVING,
} from "./variables";

export function activenessLabel(score: number): "thriving" | "active" | "cooling" | "quiet" {
  if (score >= ACTIVENESS_LABEL_THRIVING) return "thriving";
  if (score >= ACTIVENESS_LABEL_ACTIVE) return "active";
  if (score >= ACTIVENESS_LABEL_COOLING) return "cooling";
  return "quiet";
}

export function serializeResult(result: BuildscoreResult) {
  return {
    username: result.username,
    generatedAt: result.generatedAt.toISOString(),
    score: result.score,
    vector: {
      velocity: result.vector.velocity,
      finishing: result.vector.finishing,
      iteration: result.vector.iteration,
      consistency: result.vector.consistency,
      ambition: result.vector.ambition,
      quality: result.vector.quality,
      aiLeverage: result.vector.aiLeverage,
      efficiency: result.vector.efficiency,
    },
    stats: {
      projectsStarted: result.stats.projectsStarted,
      meaningfulProjects: result.stats.meaningfulProjects,
      shippedProjects: result.stats.shippedProjects,
      completionRate: result.stats.completionRate,
      graveyardRate: result.stats.graveyardRate,
      medianTimeToShipDays: result.stats.medianTimeToShipDays,
      avgActiveness: result.stats.avgActiveness,
      longestStreakDays: result.stats.longestStreakDays,
      avgReleasesPerShipped: result.stats.avgReleasesPerShipped,
    },
    repos: result.repos.map((c) => ({
      name: c.repo.name,
      activeness: Math.round(c.activeness * 10) / 10,
      label: activenessLabel(c.activeness),
      isMeaningful: c.isMeaningful,
      timeToShipDays: c.timeToShipDays,
      stars: c.repo.stargazersCount,
      acid: c.repo.acid
        ? {
            summary: c.repo.acid.summary,
            architecture: c.repo.acid.architecture,
            crossDomain: c.repo.acid.crossDomain,
            innovation: c.repo.acid.innovation,
            documentation: c.repo.acid.documentation,
          }
        : null,
    })),
  };
}

export type SerializedBuildscoreResult = ReturnType<typeof serializeResult>;
