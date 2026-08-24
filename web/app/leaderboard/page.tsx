import type { Metadata } from "next";
import Link from "next/link";

import { getLeaderboard, getLeaderboardCount } from "@/lib/buildscore/db/user-scores";
import { scoreTier } from "@/lib/buildscore/serialize";
import { LEADERBOARD_PAGE_SIZE } from "@/lib/buildscore/variables";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Leaderboard — Buildscore",
  description: "Every builder who's been scanned, ranked by Buildscore.",
};

const TIER_STYLE: Record<string, string> = {
  "S+": "bg-dim-consistency/15 text-dim-consistency",
  S: "bg-dim-consistency/15 text-dim-consistency",
  A: "bg-dim-ambition/15 text-dim-ambition",
  B: "bg-dim-finishing/15 text-dim-finishing",
  C: "bg-muted text-muted-foreground",
};

function timeAgo(date: Date): string {
  const days = Math.round((Date.now() - date.getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number(rawPage) || 1);
  const offset = (page - 1) * LEADERBOARD_PAGE_SIZE;

  const [entries, total] = await Promise.all([
    getLeaderboard(LEADERBOARD_PAGE_SIZE, offset),
    getLeaderboardCount(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / LEADERBOARD_PAGE_SIZE));

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-20">
        <div className="w-full max-w-2xl">
          <h1 className="font-condensed text-4xl font-semibold tracking-tight sm:text-5xl">
            leaderboard
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Every builder who&apos;s run a scan, ranked by Buildscore. Not a popularity contest --
            just whoever&apos;s actually shipping.
          </p>

          {entries.length === 0 ? (
            <p className="mt-10 text-sm text-muted-foreground">
              Nobody&apos;s been scanned yet.{" "}
              <Link href="/#score-form" className="underline underline-offset-2 hover:text-foreground">
                Be the first.
              </Link>
            </p>
          ) : (
            <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
              {entries.map((entry, i) => {
                const rank = offset + i + 1;
                const tier = scoreTier(entry.score);
                return (
                  <Link
                    key={entry.username}
                    href={`/${entry.username}`}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                  >
                    <span className="w-7 shrink-0 text-right font-condensed text-sm font-semibold text-muted-foreground tabular-nums">
                      {rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-sm font-medium">
                      @{entry.username}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(entry.generatedAt)}
                    </span>
                    <span className="w-10 shrink-0 text-right font-condensed text-sm font-bold tabular-nums">
                      {Math.round(entry.score)}
                    </span>
                    <span
                      className={`w-8 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-bold ${TIER_STYLE[tier]}`}
                    >
                      {tier}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <Link
                href={`/leaderboard?page=${page - 1}`}
                aria-disabled={page <= 1}
                className={
                  page <= 1
                    ? "pointer-events-none text-muted-foreground/40"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                ← previous
              </Link>
              <span className="text-xs text-muted-foreground">
                page {page} of {totalPages}
              </span>
              <Link
                href={`/leaderboard?page=${page + 1}`}
                aria-disabled={page >= totalPages}
                className={
                  page >= totalPages
                    ? "pointer-events-none text-muted-foreground/40"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                next →
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
