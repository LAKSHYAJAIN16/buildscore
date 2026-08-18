from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Release:
    published_at: datetime


@dataclass
class AcidAnalysis:
    """LLM-generated per-repo analysis -- GitRoll calls their version of this
    ACID (Architecture, Cross-Domain, Innovation, Documentation); ours isn't
    trademarked so no (c). Each sub-score is 1-5. `summary` is a 1-2 sentence
    plain-English description of what the repo does and why it scored the
    way it did -- shown to the user, not just folded into a number."""

    summary: str
    architecture: int
    cross_domain: int
    innovation: int
    documentation: int


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
    weekly_commit_activity: list[dict]
    code_frequency: list[list[int]]
    root_entries: list[str]
    recent_commit_messages: list[str]
    description: str | None = None
    acid: AcidAnalysis | None = None


@dataclass
class RepoClassification:
    repo: RepoData
    activeness: float
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
    avg_activeness: float
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
class NotableContribution:
    """An external repo (not owned by the scanned user) they have at least
    one merged PR in -- GitHub's Search API only, no cloning/scanning."""

    repo_full_name: str
    stars: int
    merged_pr_count: int


@dataclass
class BuildscoreResult:
    username: str
    generated_at: datetime
    stats: BuilderStats
    vector: BuilderVector
    score: float
    repos: list[RepoClassification]
    notable_contributions: list[NotableContribution] = field(default_factory=list)
