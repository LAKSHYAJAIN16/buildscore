from __future__ import annotations

import re
import statistics
from datetime import datetime, timedelta, timezone

from .models import BuilderStats, BuilderVector, RepoClassification
from .variables import (
    ACTIVENESS_GRAVEYARD_THRESHOLD,
    AI_CONFIG_FILENAMES,
    AI_LEVERAGE_COMMIT_WEIGHT,
    AI_LEVERAGE_CONFIG_POINTS,
    AMBITION_DIVERSITY_CAP,
    AMBITION_DIVERSITY_PER_LANGUAGE,
    AMBITION_LANGUAGE_BONUS,
    AMBITION_SIZE_CAP,
    AMBITION_SIZE_DIVISOR_KB,
    AMBITIOUS_LANGUAGES,
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


def _churn_stability_score(code_frequency: list[list[int]]) -> float:
    """100 for dead-steady week-to-week churn, decaying toward 0 as the
    coefficient of variation grows -- erratic spikes (one huge commit,
    long silences) score lower than a consistent trickle of work, even
    at the same total volume."""
    churns = [additions + abs(deletions) for _, additions, deletions in code_frequency]
    active = [c for c in churns if c > 0]
    if len(active) < 2:
        return 50.0  # not enough signal to call it stable or erratic

    mean = statistics.mean(active)
    if mean == 0:
        return 50.0

    cv = statistics.pstdev(active) / mean
    return 100.0 * max(0.0, 1 - min(cv, QUALITY_STABILITY_CV_CEILING) / QUALITY_STABILITY_CV_CEILING)


def _repo_quality_score(repo) -> float:
    entries = set(repo.root_entries)
    structure_points = (
        (QUALITY_STRUCTURE_TEST_POINTS if entries & QUALITY_TEST_DIR_NAMES else 0)
        + (QUALITY_STRUCTURE_CI_POINTS if entries & QUALITY_CI_INDICATORS else 0)
        + (QUALITY_STRUCTURE_LICENSE_POINTS if entries & QUALITY_LICENSE_NAMES else 0)
    )
    structure_score = min(100.0, structure_points)
    stability_score = _churn_stability_score(repo.code_frequency)

    return structure_score * QUALITY_STRUCTURE_WEIGHT + stability_score * QUALITY_STABILITY_WEIGHT


_AI_COMMIT_PATTERN = re.compile(
    r"co-authored-by:\s*.*(claude|copilot|chatgpt|gpt-4|cursor|codeium|devin|windsurf)",
    re.IGNORECASE,
)


def _repo_ai_leverage_score(repo) -> float:
    has_ai_config = bool(set(repo.root_entries) & AI_CONFIG_FILENAMES)
    config_points = AI_LEVERAGE_CONFIG_POINTS if has_ai_config else 0

    messages = repo.recent_commit_messages
    ai_commit_fraction = (
        sum(1 for m in messages if _AI_COMMIT_PATTERN.search(m)) / len(messages)
        if messages
        else 0.0
    )
    commit_points = AI_LEVERAGE_COMMIT_WEIGHT * ai_commit_fraction

    return min(100.0, config_points + commit_points)


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
    quality = (
        statistics.mean(_repo_quality_score(c.repo) for c in meaningful) if meaningful else None
    )
    ai_leverage = (
        statistics.mean(_repo_ai_leverage_score(c.repo) for c in meaningful)
        if meaningful
        else None
    )

    return BuilderVector(
        velocity=velocity,
        finishing=finishing,
        iteration=iteration,
        consistency=consistency,
        ambition=ambition,
        quality=quality,
        ai_leverage=ai_leverage,
    )


def compute_score(vector: BuilderVector) -> float:
    values = {
        "velocity": vector.velocity,
        "finishing": vector.finishing,
        "iteration": vector.iteration,
        "consistency": vector.consistency,
        "ambition": vector.ambition,
        "quality": vector.quality,
        "ai_leverage": vector.ai_leverage,
        "efficiency": vector.efficiency,
    }
    available = {k: v for k, v in values.items() if v is not None}
    if not available:
        return 0.0
    weight_sum = sum(DIMENSION_WEIGHTS[k] for k in available)
    return sum(DIMENSION_WEIGHTS[k] * v for k, v in available.items()) / weight_sum
