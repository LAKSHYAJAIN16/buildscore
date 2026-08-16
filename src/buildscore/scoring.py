from __future__ import annotations

import statistics
from datetime import datetime, timedelta, timezone

from .models import BuilderStats, BuilderVector, RepoClassification
from .variables import (
    ACTIVENESS_GRAVEYARD_THRESHOLD,
    AMBITION_DIVERSITY_CAP,
    AMBITION_DIVERSITY_PER_LANGUAGE,
    AMBITION_LANGUAGE_BONUS,
    AMBITION_SIZE_CAP,
    AMBITION_SIZE_DIVISOR_KB,
    AMBITIOUS_LANGUAGES,
    DIMENSION_WEIGHTS,
    ITERATION_RELEASE_MULTIPLIER,
    VELOCITY_HALF_LIFE_DAYS,
)


def compute_stats(classifications: list[RepoClassification]) -> BuilderStats:
    meaningful = [c for c in classifications if c.is_meaningful]
    shipped = [c for c in meaningful if c.repo.releases]
    dead = [c for c in meaningful if c.activeness < ACTIVENESS_GRAVEYARD_THRESHOLD]

    ship_times = [c.time_to_ship_days for c in shipped if c.time_to_ship_days is not None]

    daily_active: set = set()
    for c in meaningful:
        for week in c.repo.weekly_commit_activity:
            week_start = datetime.fromtimestamp(week["week"], tz=timezone.utc)
            for day_offset, count in enumerate(week.get("days", [])):
                if count > 0:
                    daily_active.add((week_start + timedelta(days=day_offset)).date())

    releases_per_shipped = [len(c.repo.releases) for c in shipped]

    return BuilderStats(
        projects_started=len(classifications),
        meaningful_projects=len(meaningful),
        shipped_projects=len(shipped),
        completion_rate=len(shipped) / len(meaningful) if meaningful else 0.0,
        graveyard_rate=len(dead) / len(meaningful) if meaningful else 0.0,
        median_time_to_ship_days=statistics.median(ship_times) if ship_times else None,
        avg_activeness=statistics.mean(c.activeness for c in meaningful) if meaningful else 0.0,
        longest_streak_days=_longest_streak(daily_active),
        avg_releases_per_shipped=(
            statistics.mean(releases_per_shipped) if releases_per_shipped else 0.0
        ),
    )


def _longest_streak(days: set) -> int:
    if not days:
        return 0
    ordered = sorted(days)
    longest = current = 1
    for prev, curr in zip(ordered, ordered[1:]):
        if (curr - prev).days == 1:
            current += 1
            longest = max(longest, current)
        else:
            current = 1
    return longest


def _repo_ambition_score(repo) -> float:
    lang_bonus = sum(
        AMBITION_LANGUAGE_BONUS for lang in repo.languages if lang in AMBITIOUS_LANGUAGES
    )
    lang_diversity = min(
        AMBITION_DIVERSITY_CAP, len(repo.languages) * AMBITION_DIVERSITY_PER_LANGUAGE
    )
    size_score = min(AMBITION_SIZE_CAP, repo.size_kb / AMBITION_SIZE_DIVISOR_KB)
    return min(100.0, lang_bonus + lang_diversity + size_score)


def compute_vector(
    stats: BuilderStats, classifications: list[RepoClassification]
) -> BuilderVector:
    meaningful = [c for c in classifications if c.is_meaningful]

    velocity = (
        100 / (1 + stats.median_time_to_ship_days / VELOCITY_HALF_LIFE_DAYS)
        if stats.median_time_to_ship_days is not None
        else None
    )
    finishing = stats.completion_rate * 100 if stats.meaningful_projects else None
    iteration = (
        min(100.0, stats.avg_releases_per_shipped * ITERATION_RELEASE_MULTIPLIER)
        if stats.shipped_projects
        else None
    )
    consistency = stats.avg_activeness if stats.meaningful_projects else None
    ambition = (
        statistics.mean(_repo_ambition_score(c.repo) for c in meaningful) if meaningful else None
    )

    return BuilderVector(
        velocity=velocity,
        finishing=finishing,
        iteration=iteration,
        consistency=consistency,
        ambition=ambition,
    )


def compute_score(vector: BuilderVector) -> float:
    values = {
        "velocity": vector.velocity,
        "finishing": vector.finishing,
        "iteration": vector.iteration,
        "consistency": vector.consistency,
        "ambition": vector.ambition,
        "quality": vector.quality,
        "efficiency": vector.efficiency,
    }
    available = {k: v for k, v in values.items() if v is not None}
    if not available:
        return 0.0
    weight_sum = sum(DIMENSION_WEIGHTS[k] for k in available)
    return sum(DIMENSION_WEIGHTS[k] * v for k, v in available.items()) / weight_sum
