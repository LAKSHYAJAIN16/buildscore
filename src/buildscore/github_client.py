from __future__ import annotations

import os
import time
from datetime import datetime, timezone

import httpx

from .variables import RATE_LIMIT_SAFETY_MARGIN

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
        resp = self._client.get(url, **kwargs)
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
        # GitHub computes these stats asynchronously on first request and
        # returns 202 until the cache is warm.
        for attempt in range(5):
            resp = self._get(f"/repos/{owner}/{repo}/stats/commit_activity")
            if resp.status_code == 202:
                time.sleep(2 * (attempt + 1))
                continue
            if resp.status_code == 204:
                return []
            resp.raise_for_status()
            return resp.json()
        return []
