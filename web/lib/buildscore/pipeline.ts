// Orchestration: wires github-client.ts + the Postgres cache + lifecycle.ts
// /scoring.ts together. cli.py does this inline in score(); the web version
// needs it as its own module because it also has to survive being resumed
// across multiple chunked serverless invocations.

import { runWithConcurrency } from "./concurrency";
import {
  createGitHubClient,
  GithubUserNotFoundError,
  RateLimitError,
} from "./github-client";
import { classifyRepo } from "./lifecycle";
import type { RawGithubRepo, RepoClassification, RepoData } from "./models";
import { computeScore, computeStats, computeVector } from "./scoring";
import { checkForSuspiciousDrift } from "./security";
import { serializeResult } from "./serialize";
import { CONCURRENT_REPO_FETCHES, SCAN_ABSOLUTE_TIMEOUT_MINUTES, SCAN_CHUNK_TIME_BUDGET_MS, SCAN_MAX_REPOS } from "./variables";
import { getCachedRepo, upsertCachedRepo } from "./db/repos-cache";
import {
  getUserScore,
  markCompleted,
  markFailed,
  updateScanProgress,
  updateScanSnapshot,
} from "./db/user-scores";
import { isRepoWorthFullAnalysis } from "./lifecycle";

function baseRepoData(raw: RawGithubRepo, overrides?: Partial<RepoData>): RepoData {
  return {
    name: raw.name,
    fullName: raw.full_name,
    createdAt: new Date(raw.created_at),
    pushedAt: new Date(raw.pushed_at),
    isFork: raw.fork,
    isArchived: raw.archived,
    sizeKb: raw.size,
    stargazersCount: raw.stargazers_count,
    languages: {},
    releases: [],
    weeklyCommitActivity: [],
    codeFrequency: [],
    ...overrides,
  };
}

async function getOrFetchRepoData(
  client: ReturnType<typeof createGitHubClient>,
  raw: RawGithubRepo
): Promise<RepoData> {
  if (!isRepoWorthFullAnalysis(raw.size, raw.fork)) {
    // Repos too small/trivial to be worth the ~4 extra API calls are scored
    // 0 directly, without ever touching the network or the cache for them.
    return baseRepoData(raw);
  }

  const fullName = raw.full_name.toLowerCase();
  const cached = await getCachedRepo(fullName);
  const pushedAt = new Date(raw.pushed_at);

  if (cached && cached.pushedAt.getTime() === pushedAt.getTime()) {
    // Unchanged since we last saw it -- skip all 4 extra GitHub calls.
    return baseRepoData(raw, {
      languages: cached.languages,
      releases: cached.releases.filter(
        (r): r is { publishedAt: Date } => r.publishedAt !== null
      ),
      weeklyCommitActivity: cached.weeklyCommitActivity,
      codeFrequency: cached.codeFrequency,
    });
  }

  const owner = raw.owner.login;
  const name = raw.name;
  const [releasesRaw, languages, weeklyCommitActivity, codeFrequency] = await Promise.all([
    client.listReleases(owner, name),
    client.languages(owner, name),
    client.commitActivity(owner, name),
    client.codeFrequency(owner, name),
  ]);

  const releases = releasesRaw
    .filter((r) => r.published_at)
    .map((r) => ({ publishedAt: new Date(r.published_at as string) }))
    .sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());

  // Write the cache immediately, per repo -- not batched at scan end -- so
  // a scan interrupted by rate limiting or a timeout still leaves useful,
  // reusable cache behind for the next attempt.
  await upsertCachedRepo({
    fullName,
    owner,
    name,
    pushedAt,
    createdAt: new Date(raw.created_at),
    isFork: raw.fork,
    isArchived: raw.archived,
    sizeKb: raw.size,
    stargazersCount: raw.stargazers_count,
    languages,
    releases,
    weeklyCommitActivity: weeklyCommitActivity as RepoData["weeklyCommitActivity"],
    codeFrequency,
  });

  return baseRepoData(raw, {
    languages,
    releases,
    weeklyCommitActivity: weeklyCommitActivity as RepoData["weeklyCommitActivity"],
    codeFrequency,
  });
}

export async function runScanChunk(username: string): Promise<void> {
  const job = await getUserScore(username);
  if (!job || job.status === "completed" || job.status === "failed") return; // stale continuation, no-op

  if (Date.now() - job.requestedAt.getTime() > SCAN_ABSOLUTE_TIMEOUT_MINUTES * 60_000) {
    await markFailed(username, "Scan timed out. Please try again.");
    return;
  }

  const client = createGitHubClient(process.env.GITHUB_TOKEN);
  let snapshot = job.repoListingSnapshot;
  let processedIndex = job.progress?.processedIndex ?? 0;

  if (!snapshot) {
    // First chunk of this scan attempt: list once, cache the fixed-order
    // snapshot for all future chunks to walk.
    let raw: RawGithubRepo[];
    try {
      raw = await client.listRepos(username);
    } catch (err) {
      if (err instanceof GithubUserNotFoundError) {
        await markFailed(username, "GitHub user not found.");
        return;
      }
      throw err;
    }
    snapshot = raw.filter((r) => !r.fork).slice(0, SCAN_MAX_REPOS);
    await updateScanSnapshot(username, snapshot);
    processedIndex = 0;
  }

  const chunkStart = Date.now();
  try {
    while (processedIndex < snapshot.length && Date.now() - chunkStart < SCAN_CHUNK_TIME_BUDGET_MS) {
      const batch = snapshot.slice(processedIndex, processedIndex + CONCURRENT_REPO_FETCHES);
      await runWithConcurrency(batch, CONCURRENT_REPO_FETCHES, (raw) => getOrFetchRepoData(client, raw));
      processedIndex += batch.length;
      await updateScanProgress(username, { processedIndex, total: snapshot.length });
    }
  } catch (err) {
    if (err instanceof RateLimitError) {
      const reset = client.rateLimitReset?.toISOString() ?? "later";
      await markFailed(username, `GitHub API rate limit reached. Try again after ${reset}.`);
      return;
    }
    throw err;
  } finally {
    await checkForSuspiciousDrift(client);
  }

  if (processedIndex >= snapshot.length) {
    await finalizeScan(username, snapshot);
    return;
  }

  // Not done -- hand off to a fresh invocation. Awaited (at least until the
  // next invocation's response headers arrive) since Vercel freezes the
  // function environment once after()'s promise settles; a true
  // fire-and-forget without awaiting risks the request being dropped.
  const baseUrl = process.env.APP_BASE_URL;
  const secret = process.env.INTERNAL_WORKER_SECRET;
  if (!baseUrl || !secret) {
    await markFailed(username, "Server misconfiguration (missing worker continuation config).");
    return;
  }
  await fetch(`${baseUrl}/api/scan/worker`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-internal-secret": secret },
    body: JSON.stringify({ username }),
  });
}

async function finalizeScan(username: string, snapshot: RawGithubRepo[]): Promise<void> {
  const now = new Date();
  // Every repo here was already fetched (and cached) by the chunk loop
  // above, so this is a cache-read pass only -- no further GitHub calls.
  const client = createGitHubClient(process.env.GITHUB_TOKEN);
  const classifications: RepoClassification[] = [];
  for (const raw of snapshot) {
    const repoData = await getOrFetchRepoData(client, raw);
    classifications.push(classifyRepo(repoData, now));
  }

  const stats = computeStats(classifications);
  const vector = computeVector(stats, classifications);
  const score = computeScore(vector);

  const result = serializeResult({
    username,
    generatedAt: now,
    stats,
    vector,
    score: Math.round(score * 10) / 10,
    repos: classifications,
  });

  await markCompleted(username, result);
}
