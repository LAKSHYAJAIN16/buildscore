import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPercentile, getUserScore, type UserScoreRow } from "@/lib/buildscore/db/user-scores";
import type { SerializedBuildscoreResult } from "@/lib/buildscore/serialize";
import { scoreTier } from "@/lib/buildscore/serialize";
import { isValidGithubUsername } from "@/lib/buildscore/username";
import { DIMENSION_WEIGHTS } from "@/lib/buildscore/variables";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { ProfileView, type ProfileData } from "./ProfileView";

export const runtime = "nodejs";

// Every scanned username is a distinct public URL (buildscore.dev/<username>)
// backed by the same `user_scores` table the scan API reads/writes -- there
// is no separate "profile" record, this page just renders that row. Reserved
// top-level paths (/blog, /grants, /leaderboard, /api, ...) all win over this
// dynamic segment since Next.js matches literal route segments first.
async function loadRow(rawUsername: string): Promise<{ username: string; row: UserScoreRow | null } | null> {
  if (!isValidGithubUsername(rawUsername)) return null;
  const username = rawUsername.toLowerCase();
  const row = await getUserScore(username);
  return { username, row };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username: raw } = await params;
  const loaded = await loadRow(raw);
  if (!loaded) return {};
  const { username, row } = loaded;

  if (row?.status === "completed" && row.result) {
    const result = row.result as SerializedBuildscoreResult;
    return {
      title: `@${username} — ${result.score}/100 · Buildscore`,
      description: `${username}'s Buildscore: velocity, finishing, ambition and more, reconstructed from real GitHub history -- not commit counts.`,
    };
  }
  return {
    title: `@${username} — Buildscore`,
    description: `See ${username}'s Buildscore -- a measure of demonstrated shipping ability, not code volume.`,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username: raw } = await params;
  const loaded = await loadRow(raw);
  if (!loaded) notFound();
  const { username, row } = loaded;

  let initial: ProfileData;
  if (!row) {
    initial = { status: "none" };
  } else if (row.status === "completed" && row.result) {
    const result = row.result as SerializedBuildscoreResult;
    const percentile = await getPercentile(username, result.score);
    const weights = Object.fromEntries(
      Object.entries(DIMENSION_WEIGHTS).map(([key, weight]) => [key, Math.round(weight * 100)])
    );
    initial = {
      status: "completed",
      result,
      tier: scoreTier(result.score),
      percentile,
      weights,
      generatedAt: row.generatedAt ? row.generatedAt.toISOString() : result.generatedAt,
    };
  } else if (row.status === "failed") {
    initial = { status: "failed", error: row.error ?? "The scan failed." };
  } else if (row.status === "pending" || row.status === "in_progress") {
    initial = { status: row.status, progress: row.progress };
  } else {
    // status === "completed" but result is somehow missing -- treat as if
    // never scanned rather than crashing the page on a malformed row.
    initial = { status: "none" };
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-20">
        <ProfileView username={raw} initial={initial} />
      </main>
      <SiteFooter />
    </>
  );
}
