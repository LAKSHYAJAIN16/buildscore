from __future__ import annotations

import base64
import os
import time
from datetime import datetime, timezone

import httpx

from .variables import (
    RATE_LIMIT_SAFETY_MARGIN,
    STATS_MAX_RETRIES,
    STATS_RETRY_BACKOFF_SECONDS,
    TRANSPORT_ERROR_MAX_RETRIES,
    TRANSPORT_ERROR_RETRY_BACKOFF_SECONDS,
)

GITHUB_API = "https://api.github.com"


class MissingTokenError(RuntimeError):
    pass


class RateLimitError(RuntimeError):
    pass


class GitHubClient:
    def __init__(self, token: str | None = None):
        token = token or os.environ.get("GITHUB_TOKEN")
        if not token:
            raise MissingTokenError(
                "GITHUB_TOKEN is required. Create one at "
                "https://github.com/settings/tokens and set it via --token "
                "or the GITHUB_TOKEN env var."
            )
        self._client = httpx.Client(
            base_url=GITHUB_API,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            timeout=30.0,
        )
        self.token = token
        self.rate_limit_limit: int | None = None
        self.rate_limit_remaining: int | None = None
        self.rate_limit_reset: datetime | None = None
        self.calls_made = 0

    def close(self) -> None:
        self._client.close()

    def whoami(self) -> str:
        resp = self._get("/user")
        resp.raise_for_status()
        return resp.json()["login"]

    def _get(self, url: str, **kwargs) -> httpx.Response:
        self.calls_made += 1
        resp = self._request_with_retry(url, **kwargs)
        self._record_rate_limit(resp)
        if resp.status_code == 403 and resp.headers.get("X-RateLimit-Remaining") == "0":
            reset = self.rate_limit_reset.isoformat() if self.rate_limit_reset else "unknown"
            raise RateLimitError(f"GitHub API rate limit exhausted. Resets at {reset}.")
        if (
            self.rate_limit_remaining is not None
            and self.rate_limit_remaining < RATE_LIMIT_SAFETY_MARGIN
        ):
            reset = self.rate_limit_reset.isoformat() if self.rate_limit_reset else "unknown"
            raise RateLimitError(
                f"Only {self.rate_limit_remaining} GitHub API calls left "
                f"(stopping before hitting the limit). Resets at {reset}."
            )
        return resp

    def _request_with_retry(self, url: str, **kwargs) -> httpx.Response:
        # Transient transport failures (DNS hiccups, dropped connections)
        # are common on long scans with many sequential requests -- retry a
        # few times with backoff before giving up. Distinct from
        # _get_stats's 202-polling loop, which retries a *successful*
        # response that just isn't ready yet.
        last_exc: httpx.TransportError | None = None
        for attempt in range(TRANSPORT_ERROR_MAX_RETRIES):
            try:
                return self._client.get(url, **kwargs)
            except httpx.TransportError as exc:
                last_exc = exc
                if attempt < TRANSPORT_ERROR_MAX_RETRIES - 1:
                    time.sleep(TRANSPORT_ERROR_RETRY_BACKOFF_SECONDS * (attempt + 1))
        assert last_exc is not None
        raise last_exc

    def _record_rate_limit(self, resp: httpx.Response) -> None:
        limit = resp.headers.get("X-RateLimit-Limit")
        remaining = resp.headers.get("X-RateLimit-Remaining")
        reset = resp.headers.get("X-RateLimit-Reset")
        if limit is not None:
            self.rate_limit_limit = int(limit)
        if remaining is not None:
            self.rate_limit_remaining = int(remaining)
        if reset is not None:
            self.rate_limit_reset = datetime.fromtimestamp(int(reset), tz=timezone.utc)

    def list_repos(self, username: str) -> list[dict]:
        repos: list[dict] = []
        page = 1
        while True:
            resp = self._get(
                f"/users/{username}/repos",
                params={"per_page": 100, "page": page, "type": "owner", "sort": "created"},
            )
            resp.raise_for_status()
            batch = resp.json()
            if not batch:
                break
            repos.extend(batch)
            page += 1
        return repos

    def list_releases(self, owner: str, repo: str) -> list[dict]:
        resp = self._get(f"/repos/{owner}/{repo}/releases", params={"per_page": 100})
        resp.raise_for_status()
        return resp.json()

    def languages(self, owner: str, repo: str) -> dict[str, int]:
        resp = self._get(f"/repos/{owner}/{repo}/languages")
        resp.raise_for_status()
        return resp.json()

    def commit_activity(self, owner: str, repo: str) -> list[dict]:
        return self._get_stats(f"/repos/{owner}/{repo}/stats/commit_activity")

    def repo_root_contents(self, owner: str, repo: str) -> list[str]:
        """Top-level file/directory names in the repo's default branch --
        one cheap call, shared by the quality and AI-leverage heuristics
        (tests/CI/license presence, AI tool config files)."""
        resp = self._get(f"/repos/{owner}/{repo}/contents")
        resp.raise_for_status()
        return [entry["name"] for entry in resp.json()]

    def list_recent_commits(self, owner: str, repo: str, limit: int) -> list[str]:
        """Commit messages for the most recent `limit` commits on the
        default branch -- used to detect AI co-authorship signals."""
        resp = self._get(f"/repos/{owner}/{repo}/commits", params={"per_page": limit})
        resp.raise_for_status()
        return [c["commit"]["message"] for c in resp.json()]

    def code_frequency(self, owner: str, repo: str) -> list[list[int]]:
        return self._get_stats(f"/repos/{owner}/{repo}/stats/code_frequency")

    def search_merged_prs(self, username: str, limit: int) -> list[dict]:
        """Merged PRs authored by `username`, most recent first.

        Uses GitHub's Search API, which has its own separate, much lower
        rate-limit bucket (30 req/min) than core REST calls -- goes through
        `_get_search` rather than `_get` so its rate-limit headers never
        overwrite the core-bucket tracking `_get`'s safety check relies on
        (mixing the two would make that check trip prematurely after a
        single search call, even with thousands of core calls left)."""
        resp = self._get_search(
            "/search/issues",
            params={
                "q": f"author:{username} type:pr is:merged",
                "per_page": min(limit, 100),
                "sort": "created",
                "order": "desc",
            },
        )
        resp.raise_for_status()
        return resp.json().get("items", [])

    def repo_stars(self, owner: str, repo: str) -> int:
        resp = self._get(f"/repos/{owner}/{repo}")
        resp.raise_for_status()
        return resp.json().get("stargazers_count", 0)

    def _get_search(self, url: str, **kwargs) -> httpx.Response:
        self.calls_made += 1
        return self._request_with_retry(url, **kwargs)

    def readme(self, owner: str, repo: str) -> str:
        """Decoded README text, or "" if the repo has none. Feeds the ACID
        analysis (see acid.py) -- not used for anything else, so a missing
        README is not an error."""
        resp = self._get(f"/repos/{owner}/{repo}/readme")
        if resp.status_code == 404:
            return ""
        resp.raise_for_status()
        body = resp.json()
        content = body.get("content", "")
        try:
            return base64.b64decode(content).decode("utf-8", errors="replace")
        except (ValueError, TypeError):
            return ""

    def _get_stats(self, url: str) -> list:
        # GitHub computes these stats asynchronously on first request and
        # returns 202 until the cache is warm.
        for attempt in range(STATS_MAX_RETRIES):
            resp = self._get(url)
            if resp.status_code == 202:
                time.sleep(STATS_RETRY_BACKOFF_SECONDS * (attempt + 1))
                continue
            if resp.status_code == 204:
                return []
            resp.raise_for_status()
            return resp.json()
        return []
