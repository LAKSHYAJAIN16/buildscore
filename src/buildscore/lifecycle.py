from __future__ import annotations

from datetime import datetime

from .models import RepoClassification, RepoData

MIN_COMMITS_FOR_MEANINGFUL = 3
ACTIVE_DAYS = 60
STALE_DAYS = 180


def _days_since(dt: datetime, now: datetime) -> float:
    return (now - dt).total_seconds() / 86400


def classify_repo(repo: RepoData, now: datetime) -> RepoClassification:
    is_meaningful = not repo.is_fork and repo.commit_count_estimate >= MIN_COMMITS_FOR_MEANINGFUL

    ship_date = repo.releases[0].published_at if repo.releases else None
    time_to_ship_days = (
        (ship_date - repo.created_at).total_seconds() / 86400 if ship_date else None
    )

    age_since_push = _days_since(repo.pushed_at, now)

    if not is_meaningful:
        stage = "not_meaningful"
    elif repo.releases:
        stage = "maintained" if age_since_push <= ACTIVE_DAYS else "shipped"
    elif repo.is_archived:
        stage = "abandoned"
    elif age_since_push <= ACTIVE_DAYS:
        stage = "active"
    elif age_since_push <= STALE_DAYS:
        stage = "dormant"
    else:
        stage = "abandoned"

    return RepoClassification(
        repo=repo,
        stage=stage,
        is_meaningful=is_meaningful,
        ship_date=ship_date,
        time_to_ship_days=time_to_ship_days,
    )
