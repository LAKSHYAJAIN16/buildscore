from __future__ import annotations

import json
from datetime import datetime, timezone

import httpx
import typer
from rich.console import Console
from rich.table import Table

from .github_client import GitHubClient, MissingTokenError, RateLimitError
from .lifecycle import classify_repo, is_repo_worth_full_analysis
from .models import BuildscoreResult, Release, RepoData
from .scoring import compute_score, compute_stats, compute_vector
from .security import check_for_suspicious_drift
from .variables import (
    ACTIVENESS_LABEL_ACTIVE,
    ACTIVENESS_LABEL_COOLING,
    ACTIVENESS_LABEL_THRIVING,
    AI_COMMIT_SAMPLE_SIZE,
    DEFAULT_MAX_REPOS,
)

app = typer.Typer(add_completion=False)
console = Console()


def _parse_dt(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def _base_repo_data(raw_repo: dict, **overrides) -> RepoData:
    fields = {
        "name": raw_repo["name"],
        "full_name": raw_repo["full_name"],
        "created_at": _parse_dt(raw_repo["created_at"]),
        "pushed_at": _parse_dt(raw_repo["pushed_at"]),
        "is_fork": raw_repo["fork"],
        "is_archived": raw_repo["archived"],
        "size_kb": raw_repo["size"],
        "stargazers_count": raw_repo["stargazers_count"],
        "languages": {},
        "releases": [],
        "weekly_commit_activity": [],
        "code_frequency": [],
        "root_entries": [],
        "recent_commit_messages": [],
    }
    fields.update(overrides)
    return RepoData(**fields)


def _fetch_repo_data(client: GitHubClient, raw_repo: dict) -> RepoData:
    # Repos too small/trivial to be worth the ~6 extra API calls are
    # scored 0 directly, without ever touching the network for them.
    if not is_repo_worth_full_analysis(raw_repo["size"], raw_repo["fork"]):
        return _base_repo_data(raw_repo)

    owner = raw_repo["owner"]["login"]
    name = raw_repo["name"]

    releases_raw = client.list_releases(owner, name)
    releases = sorted(
        (
            Release(published_at=_parse_dt(r["published_at"]))
            for r in releases_raw
            if r.get("published_at")
        ),
        key=lambda r: r.published_at,
    )

    languages = client.languages(owner, name)
    weekly_activity = client.commit_activity(owner, name)
    code_freq = client.code_frequency(owner, name)
    root_entries = client.repo_root_contents(owner, name)
    recent_commit_messages = client.list_recent_commits(owner, name, AI_COMMIT_SAMPLE_SIZE)

    return _base_repo_data(
        raw_repo,
        languages=languages,
        releases=releases,
        weekly_commit_activity=weekly_activity,
        code_frequency=code_freq,
        root_entries=root_entries,
        recent_commit_messages=recent_commit_messages,
    )


@app.command()
def score(
    username: str,
    token: str = typer.Option(None, "--token", envvar="GITHUB_TOKEN"),
    pretty: bool = typer.Option(
        False, "--pretty", help="Print a human-readable summary instead of JSON"
    ),
    max_repos: int = typer.Option(
        DEFAULT_MAX_REPOS, "--max-repos", help="Cap on number of repos processed (API cost control)"
    ),
):
    try:
        client = GitHubClient(token=token)
    except MissingTokenError as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(1)

    try:
        authenticated_as = client.whoami()
        console.print(f"[dim]Authenticated as: {authenticated_as}[/dim]")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            console.print("[bold red]Error:[/bold red] Token is invalid or expired.")
            client.close()
            raise typer.Exit(1)
        console.print("[dim]Could not verify token identity (continuing anyway).[/dim]")

    now = datetime.now(timezone.utc)
    raw_repos: list[dict] = []
    classifications = []
    try:
        with console.status(f"Fetching repos for {username}..."):
            raw_repos = client.list_repos(username)

        raw_repos = [r for r in raw_repos if not r["fork"]][:max_repos]

        with console.status("Analyzing repos...") as status:
            for i, raw in enumerate(raw_repos, start=1):
                status.update(f"Analyzing {raw['name']} ({i}/{len(raw_repos)})...")
                repo_data = _fetch_repo_data(client, raw)
                classifications.append(classify_repo(repo_data, now))
    except RateLimitError as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        console.print(
            f"Scored {len(classifications)}/{len(raw_repos)} repos before stopping. "
            "Try again later, or pass a smaller --max-repos."
        )
        raise typer.Exit(1)
    finally:
        remaining = client.rate_limit_remaining
        limit = client.rate_limit_limit
        if remaining is not None and limit is not None:
            console.print(f"[dim]GitHub API calls remaining: {remaining}/{limit}[/dim]")

        drift_warning = check_for_suspicious_drift(client)
        if drift_warning is not None:
            console.print(f"[bold yellow]Warning:[/bold yellow] {drift_warning.message}")

        client.close()

    stats = compute_stats(classifications)
    vector = compute_vector(stats, classifications)
    buildscore = compute_score(vector)

    result = BuildscoreResult(
        username=username,
        generated_at=now,
        stats=stats,
        vector=vector,
        score=round(buildscore, 1),
        repos=classifications,
    )

    if pretty:
        _print_pretty(result)
    else:
        console.print_json(json.dumps(_serialize(result)))


def _print_pretty(result: BuildscoreResult) -> None:
    console.print(f"\n[bold]Buildscore for {result.username}[/bold]: {result.score}/100\n")

    table = Table(show_header=True, header_style="bold")
    table.add_column("Dimension")
    table.add_column("Score", justify="right")
    for label, value in [
        ("Shipping Velocity", result.vector.velocity),
        ("Completion", result.vector.finishing),
        ("Iteration", result.vector.iteration),
        ("Consistency", result.vector.consistency),
        ("Technical Ambition", result.vector.ambition),
        ("Quality", result.vector.quality),
        ("AI Leverage", result.vector.ai_leverage),
    ]:
        table.add_row(label, f"{value:.0f}" if value is not None else "n/a")
    console.print(table)

    s = result.stats
    console.print(f"\nProjects started: {s.projects_started}")
    console.print(f"Meaningful projects: {s.meaningful_projects}")
    console.print(f"Shipped: {s.shipped_projects}")
    console.print(f"Completion rate: {s.completion_rate:.0%}")
    console.print(f"Graveyard rate: {s.graveyard_rate:.0%}")
    if s.median_time_to_ship_days is not None:
        console.print(f"Median time-to-ship: {s.median_time_to_ship_days:.1f} days")
    else:
        console.print("Median time-to-ship: n/a")
    console.print(f"Average activeness: {s.avg_activeness:.0f}/100")
    console.print(f"Longest commit streak: {s.longest_streak_days} days")
    console.print()


def _activeness_label(score: float) -> str:
    if score >= ACTIVENESS_LABEL_THRIVING:
        return "thriving"
    if score >= ACTIVENESS_LABEL_ACTIVE:
        return "active"
    if score >= ACTIVENESS_LABEL_COOLING:
        return "cooling"
    return "quiet"


def _serialize(result: BuildscoreResult) -> dict:
    return {
        "username": result.username,
        "generated_at": result.generated_at.isoformat(),
        "score": result.score,
        "vector": {
            "velocity": result.vector.velocity,
            "finishing": result.vector.finishing,
            "iteration": result.vector.iteration,
            "consistency": result.vector.consistency,
            "ambition": result.vector.ambition,
            "quality": result.vector.quality,
            "ai_leverage": result.vector.ai_leverage,
            "efficiency": result.vector.efficiency,
        },
        "stats": {
            "projects_started": result.stats.projects_started,
            "meaningful_projects": result.stats.meaningful_projects,
            "shipped_projects": result.stats.shipped_projects,
            "completion_rate": result.stats.completion_rate,
            "graveyard_rate": result.stats.graveyard_rate,
            "median_time_to_ship_days": result.stats.median_time_to_ship_days,
            "avg_activeness": result.stats.avg_activeness,
            "longest_streak_days": result.stats.longest_streak_days,
            "avg_releases_per_shipped": result.stats.avg_releases_per_shipped,
        },
        "repos": [
            {
                "name": c.repo.name,
                "activeness": round(c.activeness, 1),
                "label": _activeness_label(c.activeness),
                "is_meaningful": c.is_meaningful,
                "time_to_ship_days": c.time_to_ship_days,
                "stars": c.repo.stargazers_count,
            }
            for c in result.repos
        ],
    }


if __name__ == "__main__":
    app()
