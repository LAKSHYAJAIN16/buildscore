import { eq } from "drizzle-orm";

import { db } from "./client";
import { reposCache } from "./schema";
import type { RepoData } from "../models";

export interface CachedRepo {
  pushedAt: Date;
  languages: Record<string, number>;
  releases: { publishedAt: Date | null }[];
  weeklyCommitActivity: RepoData["weeklyCommitActivity"];
  codeFrequency: number[][];
  rootEntries: string[];
  recentCommitMessages: string[];
}

export async function getCachedRepo(fullName: string): Promise<CachedRepo | null> {
  const [row] = await db
    .select()
    .from(reposCache)
    .where(eq(reposCache.fullName, fullName))
    .limit(1);
  if (!row) return null;

  return {
    pushedAt: row.pushedAt,
    languages: row.languages,
    releases: row.releases.map((r) => ({ publishedAt: r.publishedAt ? new Date(r.publishedAt) : null })),
    weeklyCommitActivity: row.weeklyCommitActivity,
    codeFrequency: row.codeFrequency,
    rootEntries: row.rootEntries,
    recentCommitMessages: row.recentCommitMessages,
  };
}

export interface UpsertCachedRepoInput {
  fullName: string;
  owner: string;
  name: string;
  pushedAt: Date;
  createdAt: Date;
  isFork: boolean;
  isArchived: boolean;
  sizeKb: number;
  stargazersCount: number;
  languages: Record<string, number>;
  releases: { publishedAt: Date | null }[];
  weeklyCommitActivity: RepoData["weeklyCommitActivity"];
  codeFrequency: number[][];
  rootEntries: string[];
  recentCommitMessages: string[];
}

export async function upsertCachedRepo(input: UpsertCachedRepoInput): Promise<void> {
  const row = {
    fullName: input.fullName,
    owner: input.owner,
    name: input.name,
    pushedAt: input.pushedAt,
    createdAt: input.createdAt,
    isFork: input.isFork,
    isArchived: input.isArchived,
    sizeKb: input.sizeKb,
    stargazersCount: input.stargazersCount,
    languages: input.languages,
    releases: input.releases.map((r) => ({ publishedAt: r.publishedAt?.toISOString() ?? null })),
    weeklyCommitActivity: input.weeklyCommitActivity,
    codeFrequency: input.codeFrequency,
    rootEntries: input.rootEntries,
    recentCommitMessages: input.recentCommitMessages,
    updatedAt: new Date(),
  };

  await db
    .insert(reposCache)
    .values(row)
    .onConflictDoUpdate({ target: reposCache.fullName, set: row });
}
