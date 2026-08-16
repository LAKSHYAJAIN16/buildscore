from __future__ import annotations

import math
from datetime import datetime, timezone

from .models import RepoClassification, RepoData
from .variables import (
    ACTIVENESS_FREQUENCY_WEIGHT,
    ACTIVENESS_MAGNITUDE_WEIGHT,
    ACTIVENESS_RECENCY_WEIGHT,
    MAGNITUDE_REFERENCE_WEEKLY_CHURN,
    RECENCY_HALF_LIFE_DAYS,
    SMALL_REPO_SIZE_KB_THRESHOLD,
)


def is_repo_worth_full_analysis(size_kb: int, is_fork: bool) -> bool:
    """Cheap, zero-API-call gate using data already in the bulk repo
    listing -- decides whether a repo is worth spending the ~4 extra
    API calls on, or is trivial/empty and can be scored 0 directly."""
    return not is_fork and size_kb > SMALL_REPO_SIZE_KB_THRESHOLD


def compute_activeness(code_frequency: list[list[int]], now: datetime) -> float:
    """0-100 continuous score blended from frequency, magnitude, and
    recency of code churn across the repo's full history. Recency
    decays smoothly (half-life) instead of cliffing into "abandoned"
    at some arbitrary day count -- a project paused for months still
    scores proportionally, not categorically."""
    if not code_frequency:
        return 0.0

    weeks = [
        (datetime.fromtimestamp(week[0], tz=timezone.utc), week[1] + abs(week[2]))
        for week in code_frequency
    ]
    active_weeks = [(week_start, churn) for week_start, churn in weeks if churn > 0]
    if not active_weeks:
        return 0.0

    frequency_score = 100 * len(active_weeks) / len(weeks)

    churns = sorted(churn for _, churn in active_weeks)
    typical_churn = churns[len(churns) // 2]
    magnitude_score = 100 * min(
        1.0, math.log1p(typical_churn) / math.log1p(MAGNITUDE_REFERENCE_WEEKLY_CHURN)
    )

    last_active_week = active_weeks[-1][0]
    days_since_active = (now - last_active_week).total_seconds() / 86400
    recency_score = 100 * (0.5 ** (days_since_active / RECENCY_HALF_LIFE_DAYS))

    return (
        frequency_score * ACTIVENESS_FREQUENCY_WEIGHT
        + magnitude_score * ACTIVENESS_MAGNITUDE_WEIGHT
        + recency_score * ACTIVENESS_RECENCY_WEIGHT
    )


def classify_repo(repo: RepoData, now: datetime) -> RepoClassification:
    is_meaningful = is_repo_worth_full_analysis(repo.size_kb, repo.is_fork)

    ship_date = repo.releases[0].published_at if repo.releases else None
    time_to_ship_days = (
        (ship_date - repo.created_at).total_seconds() / 86400 if ship_date else None
    )

    activeness = compute_activeness(repo.code_frequency, now) if is_meaningful else 0.0

    return RepoClassification(
        repo=repo,
        activeness=activeness,
        is_meaningful=is_meaningful,
        ship_date=ship_date,
        time_to_ship_days=time_to_ship_days,
    )
