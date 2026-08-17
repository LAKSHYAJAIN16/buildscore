// TypeScript port of src/buildscore/github_client.py.

import {
  RATE_LIMIT_SAFETY_MARGIN,
  STATS_MAX_RETRIES,
  STATS_RETRY_BACKOFF_SECONDS,
} from "./variables";
import type { RawGithubRelease, RawGithubRepo } from "./models";

const GITHUB_API = "https://api.github.com";

export class MissingTokenError extends Error {}
export class RateLimitError extends Error {}
export class GithubUserNotFoundError extends Error {}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GitHubClient {
  readonly token: string;
  rateLimitLimit: number | null = null;
  rateLimitRemaining: number | null = null;
  rateLimitReset: Date | null = null;
  callsMade = 0;

  constructor(token: string | undefined) {
    if (!token) {
      throw new MissingTokenError(
        "GITHUB_TOKEN is required. Create one at https://github.com/settings/tokens."
      );
    }
    this.token = token;
  }

  async whoami(): Promise<string> {
    const resp = await this._get("/user");
    if (!resp.ok) throw new Error(`GitHub /user failed: ${resp.status}`);
    const body = (await resp.json()) as { login: string };
    return body.login;
  }

  private async _get(path: string, params?: Record<string, string | number>): Promise<Response> {
    const url = new URL(GITHUB_API + path);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }

    this.callsMade += 1;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    this._recordRateLimit(resp);

    if (resp.status === 403 && resp.headers.get("x-ratelimit-remaining") === "0") {
      const reset = this.rateLimitReset?.toISOString() ?? "unknown";
      throw new RateLimitError(`GitHub API rate limit exhausted. Resets at ${reset}.`);
    }
    if (this.rateLimitRemaining !== null && this.rateLimitRemaining < RATE_LIMIT_SAFETY_MARGIN) {
      const reset = this.rateLimitReset?.toISOString() ?? "unknown";
      throw new RateLimitError(
        `Only ${this.rateLimitRemaining} GitHub API calls left (stopping before hitting the limit). Resets at ${reset}.`
      );
    }
    return resp;
  }

  private _recordRateLimit(resp: Response): void {
    const limit = resp.headers.get("x-ratelimit-limit");
    const remaining = resp.headers.get("x-ratelimit-remaining");
    const reset = resp.headers.get("x-ratelimit-reset");
    if (limit !== null) this.rateLimitLimit = Number(limit);
    if (remaining !== null) this.rateLimitRemaining = Number(remaining);
    if (reset !== null) this.rateLimitReset = new Date(Number(reset) * 1000);
  }

  async listRepos(username: string): Promise<RawGithubRepo[]> {
    const repos: RawGithubRepo[] = [];
    let page = 1;
    for (;;) {
      const resp = await this._get(`/users/${encodeURIComponent(username)}/repos`, {
        per_page: 100,
        page,
        type: "owner",
        sort: "created",
      });
      if (resp.status === 404) throw new GithubUserNotFoundError(`GitHub user not found: ${username}`);
      if (!resp.ok) throw new Error(`GitHub repo listing failed: ${resp.status}`);
      const batch = (await resp.json()) as RawGithubRepo[];
      if (batch.length === 0) break;
      repos.push(...batch);
      page += 1;
    }
    return repos;
  }

  async listReleases(owner: string, repo: string): Promise<RawGithubRelease[]> {
    const resp = await this._get(`/repos/${owner}/${repo}/releases`, { per_page: 100 });
    if (!resp.ok) throw new Error(`GitHub releases failed: ${resp.status}`);
    return (await resp.json()) as RawGithubRelease[];
  }

  async languages(owner: string, repo: string): Promise<Record<string, number>> {
    const resp = await this._get(`/repos/${owner}/${repo}/languages`);
    if (!resp.ok) throw new Error(`GitHub languages failed: ${resp.status}`);
    return (await resp.json()) as Record<string, number>;
  }

  async commitActivity(owner: string, repo: string): Promise<unknown[]> {
    return this._getStats(`/repos/${owner}/${repo}/stats/commit_activity`);
  }

  async codeFrequency(owner: string, repo: string): Promise<number[][]> {
    return this._getStats(`/repos/${owner}/${repo}/stats/code_frequency`) as Promise<number[][]>;
  }

  // GitHub computes these stats asynchronously on first request and returns
  // 202 until the cache is warm.
  private async _getStats(path: string): Promise<unknown[]> {
    for (let attempt = 0; attempt < STATS_MAX_RETRIES; attempt++) {
      const resp = await this._get(path);
      if (resp.status === 202) {
        await sleep(STATS_RETRY_BACKOFF_SECONDS * 1000 * (attempt + 1));
        continue;
      }
      if (resp.status === 204) return [];
      if (!resp.ok) throw new Error(`GitHub stats failed: ${resp.status}`);
      return (await resp.json()) as unknown[];
    }
    return [];
  }
}

export function createGitHubClient(token: string | undefined): GitHubClient {
  return new GitHubClient(token);
}
