from __future__ import annotations

import os
import time

import httpx

GITHUB_API = "https://api.github.com"


class MissingTokenError(RuntimeError):
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

    def close(self) -> None:
        self._client.close()

    def list_repos(self, username: str) -> list[dict]:
        repos: list[dict] = []
        page = 1
        while True:
            resp = self._client.get(
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
        resp = self._client.get(f"/repos/{owner}/{repo}/releases", params={"per_page": 100})
        resp.raise_for_status()
        return resp.json()

    def languages(self, owner: str, repo: str) -> dict[str, int]:
        resp = self._client.get(f"/repos/{owner}/{repo}/languages")
        resp.raise_for_status()
        return resp.json()

    def commit_activity(self, owner: str, repo: str) -> list[dict]:
        # GitHub computes these stats asynchronously on first request and
        # returns 202 until the cache is warm.
        for attempt in range(5):
            resp = self._client.get(f"/repos/{owner}/{repo}/stats/commit_activity")
            if resp.status_code == 202:
                time.sleep(2 * (attempt + 1))
                continue
            if resp.status_code == 204:
                return []
            resp.raise_for_status()
            return resp.json()
        return []
