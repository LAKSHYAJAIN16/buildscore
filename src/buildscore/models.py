from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass
class Release:
    published_at: datetime


@dataclass
class RepoData:
    name: str
    full_name: str
    created_at: datetime
    pushed_at: datetime
    is_fork: bool
    is_archived: bool
    size_kb: int
    stargazers_count: int
    languages: dict[str, int]
    releases: list[Release]
    commit_count_estimate: int
    weekly_commit_activity: list[dict]


@dataclass
class RepoClassification:
    repo: RepoData
    stage: str
    is_meaningful: bool
    ship_date: datetime | None
    time_to_ship_days: float | None


@dataclass
class BuilderStats:
    projects_started: int
    meaningful_projects: int
    shipped_projects: int
    completion_rate: float
    graveyard_rate: float
    median_time_to_ship_days: float | None
    active_weeks_ratio: float
    longest_streak_days: int
    avg_releases_per_shipped: float


@dataclass
class BuilderVector:
    velocity: float | None
    finishing: float | None
    iteration: float | None
    consistency: float | None
    ambition: float | None
    quality: float | None = None
    ai_leverage: float | None = None
    efficiency: float | None = None


@dataclass
class BuildscoreResult:
    username: str
    generated_at: datetime
    stats: BuilderStats
    vector: BuilderVector
    score: float
    repos: list[RepoClassification]
