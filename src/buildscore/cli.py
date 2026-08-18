from __future__ import annotations

import json
from datetime import datetime, timezone

import anthropic
import httpx
import typer
from rich.console import Console
from rich.table import Table

from .acid import analyze_repo, create_acid_client
from .github_client import GitHubClient, MissingTokenError, RateLimitError
from .lifecycle import classify_repo, is_repo_worth_full_analysis
from .models import BuildscoreResult, NotableContribution, Release, RepoData
from .scoring import compute_score, compute_stats, compute_vector
from .security import check_for_suspicious_drift
from .variables import (
    ACTIVENESS_LABEL_ACTIVE,
    ACTIVENESS_LABEL_COOLING,
    ACTIVENESS_LABEL_THRIVING,
    AI_COMMIT_SAMPLE_SIZE,
    DEFAULT_MAX_REPOS,
    NOTABLE_CONTRIBUTIONS_SEARCH_LIMIT,
    NOTABLE_CONTRIBUTIONS_TOP_N,
    SCORE_TIER_A,
    SCORE_TIER_B,
    SCORE_TIER_S,
    SCORE_TIER_S_PLUS,
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
        "description": raw_repo.get("description"),
    }
    fields.update(overrides)
    return RepoData(**fields)


def _fetch_repo_data(
    client: GitHubClient, raw_repo: dict, acid_client: anthropic.Anthropic | None
) -> RepoData:
    # Repos too small/trivial to be worth the ~6-7 extra API calls are
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

    acid_result = None
    if acid_client is not None:
        readme = client.readme(owner, name)
        acid_result = analyze_repo(
            acid_client,
            name=name,
            description=raw_repo.get("description"),
            languages=list(languages.keys()),
            root_entries=root_entries,
            readme=readme,
        )

    return _base_repo_data(
        raw_repo,
        languages=languages,
        releases=releases,
        weekly_commit_activity=weekly_activity,
        code_frequency=code_freq,
        root_entries=root_entries,
        recent_commit_messages=recent_commit_messages,
        acid=acid_result,
    )


def _fetch_notable_contributions(
    client: GitHubClient, username: str, own_repo_full_names: set[str]
) -> list[NotableContribution]:
    """External repos the user has merged PRs in, ranked by merged-PR count.
    Best-effort: any Search API failure (rate limit, network, unexpected
    response shape) degrades to an empty list rather than aborting the scan,
    same philosophy as ACID's graceful degradation."""
    try:
        items = client.search_merged_prs(username, NOTABLE_CONTRIBUTIONS_SEARCH_LIMIT)
    except Exception:
        return []

    counts: dict[str, int] = {}
    for item in items:
        repo_url = item.get("repository_url", "")
        parts = repo_url.rstrip("/").split("/")
        full_name = "/".join(parts[-2:]) if len(parts) >= 2 else ""
        if not full_name or full_name.lower() in own_repo_full_names:
            continue
        counts[full_name] = counts.get(full_name, 0) + 1

    ranked = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:NOTABLE_CONTRIBUTIONS_TOP_N]

    contributions = []
    for full_name, count in ranked:
        owner, _, repo = full_name.partition("/")
        try:
            stars = client.repo_stars(owner, repo)
        except Exception:
            stars = 0
        contributions.append(
            NotableContribution(repo_full_name=full_name, stars=stars, merged_pr_count=count)
        )
    return contributions


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
    no_acid: bool = typer.Option(
        False,
        "--no-acid",
        help="Skip LLM-based ACID repo analysis even if ANTHROPIC_API_KEY is set",
    ),
):
    try:
        client = GitHubClient(token=token)
    except MissingTokenError as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(1)

    acid_client = None if no_acid else create_acid_client()
    if acid_client is not None:
        console.print("[dim]ACID repo analysis enabled (ANTHROPIC_API_KEY found).[/dim]")

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
    all_raw_repos: list[dict] = []
    raw_repos: list[dict] = []
    classifications = []
    notable_contributions: list[NotableContribution] = []
    try:
        with console.status(f"Fetching repos for {username}..."):
            all_raw_repos = client.list_repos(username)

        raw_repos = [r for r in all_raw_repos if not r["fork"]][:max_repos]

        with console.status("Analyzing repos...") as status:
            for i, raw in enumerate(raw_repos, start=1):
                status.update(f"Analyzing {raw['name']} ({i}/{len(raw_repos)})...")
                repo_data = _fetch_repo_data(client, raw, acid_client)
                classifications.append(classify_repo(repo_data, now))

        own_repo_full_names = {r["full_name"].lower() for r in all_raw_repos}
        notable_contributions = _fetch_notable_contributions(client, username, own_repo_full_names)
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
        notable_contributions=notable_contributions,
    )

    if pretty:
        _print_pretty(result)
    else:
        console.print_json(json.dumps(_serialize(result)))


def _print_pretty(result: BuildscoreResult) -> None:
    tier = _score_tier(result.score)
    console.print(
        f"\n[bold]Buildscore for {result.username}[/bold]: "
        f"{result.score}/100 [bold]({tier})[/bold]\n"
    )

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

    acid_repos = [c for c in result.repos if c.repo.acid is not None]
    if acid_repos:
        console.print("[bold]ACID repo analysis[/bold]")
        for c in acid_repos:
            a = c.repo.acid
            assert a is not None
            console.print(f"\n  [bold]{c.repo.name}[/bold] -- {a.summary}")
            console.print(
                f"    Architecture {a.architecture}/5 · Cross-Domain {a.cross_domain}/5 · "
                f"Innovation {a.innovation}/5 · Documentation {a.documentation}/5"
            )
        console.print()

    if result.notable_contributions:
        console.print("[bold]Notable contributions[/bold] (external repos with a merged PR)")
        for nc in result.notable_contributions:
            console.print(
                f"  {nc.repo_full_name} -- {nc.stars} stars, "
                f"{nc.merged_pr_count} merged PR{'s' if nc.merged_pr_count != 1 else ''}"
            )
        console.print()


def _score_tier(score: float) -> str:
    if score >= SCORE_TIER_S_PLUS:
        return "S+"
    if score >= SCORE_TIER_S:
        return "S"
    if score >= SCORE_TIER_A:
        return "A"
    if score >= SCORE_TIER_B:
        return "B"
    return "C"


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
        "tier": _score_tier(result.score),
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
                "acid": (
                    {
                        "summary": c.repo.acid.summary,
                        "architecture": c.repo.acid.architecture,
                        "cross_domain": c.repo.acid.cross_domain,
                        "innovation": c.repo.acid.innovation,
                        "documentation": c.repo.acid.documentation,
                    }
                    if c.repo.acid is not None
                    else None
                ),
            }
            for c in result.repos
        ],
        "notable_contributions": [
            {
                "repo_full_name": nc.repo_full_name,
                "stars": nc.stars,
                "merged_pr_count": nc.merged_pr_count,
            }
            for nc in result.notable_contributions
        ],
    }


if __name__ == "__main__":
    app()
