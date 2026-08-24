"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, RefreshCw } from "lucide-react";

import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";
import type { SerializedBuildscoreResult } from "@/lib/buildscore/serialize";
import { CopyCommand } from "../components/CopyCommand";

export type Tier = "S+" | "S" | "A" | "B" | "C";

export type ProfileData =
  | { status: "none" }
  | { status: "pending" | "in_progress"; progress: { processedIndex: number; total: number } | null }
  | {
      status: "completed";
      result: SerializedBuildscoreResult;
      tier: Tier;
      percentile: number | null;
      weights: Record<string, number>;
      generatedAt: string | null;
    }
  | { status: "failed"; error: string };

type ViewState =
  | { phase: "queued"; sub: "pending" | "in_progress"; progress: { processedIndex: number; total: number } | null }
  | {
      phase: "ready";
      result: SerializedBuildscoreResult;
      tier: Tier;
      percentile: number | null;
      weights: Record<string, number>;
      generatedAt: string | null;
    }
  | { phase: "error"; message: string };

const EASE = [0.16, 1, 0.3, 1] as const;

const DIM_ORDER = [
  "velocity",
  "finishing",
  "iteration",
  "consistency",
  "ambition",
  "quality",
  "aiLeverage",
  "efficiency",
] as const;

const DIM_LABEL: Record<(typeof DIM_ORDER)[number], string> = {
  velocity: "Velocity",
  finishing: "Finishing",
  iteration: "Iteration",
  consistency: "Consistency",
  ambition: "Ambition",
  quality: "Quality",
  aiLeverage: "AI Leverage",
  efficiency: "Efficiency",
};

const DIM_BG: Record<(typeof DIM_ORDER)[number], string> = {
  velocity: "bg-dim-velocity",
  finishing: "bg-dim-finishing",
  iteration: "bg-dim-iteration",
  consistency: "bg-dim-consistency",
  ambition: "bg-dim-ambition",
  quality: "bg-dim-quality",
  aiLeverage: "bg-dim-ai-leverage",
  efficiency: "bg-dim-efficiency",
};

const TIER_STYLE: Record<Tier, string> = {
  "S+": "bg-dim-consistency/15 text-dim-consistency",
  S: "bg-dim-consistency/15 text-dim-consistency",
  A: "bg-dim-ambition/15 text-dim-ambition",
  B: "bg-dim-finishing/15 text-dim-finishing",
  C: "bg-muted text-muted-foreground",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function toViewState(data: ProfileData): ViewState {
  switch (data.status) {
    case "none":
      return { phase: "queued", sub: "pending", progress: null };
    case "pending":
    case "in_progress":
      return { phase: "queued", sub: data.status, progress: data.progress };
    case "failed":
      return { phase: "error", message: data.error };
    case "completed":
      return {
        phase: "ready",
        result: data.result,
        tier: data.tier,
        percentile: data.percentile,
        weights: data.weights,
        generatedAt: data.generatedAt,
      };
  }
}

export function ProfileView({ username, initial }: { username: string; initial: ProfileData }) {
  const [view, setView] = useState<ViewState>(() => toViewState(initial));
  const cancelled = useRef(false);

  useEffect(() => {
    return () => {
      cancelled.current = true;
    };
  }, []);

  async function poll() {
    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (cancelled.current) return;
      let data: {
        status?: string;
        error?: string;
        score?: number;
        progress?: { processedIndex: number; total: number } | null;
      } & Partial<SerializedBuildscoreResult>;
      try {
        const res = await fetch(`/api/scan/${encodeURIComponent(username)}`);
        data = await res.json();
        if (!res.ok) {
          setView({ phase: "error", message: data.error ?? "Something went wrong." });
          return;
        }
      } catch {
        setView({ phase: "error", message: "Couldn't reach the scoring service." });
        return;
      }

      if (data.status === "completed") {
        const result = data as SerializedBuildscoreResult;
        setView({
          phase: "ready",
          result,
          tier: scoreTierClient(result.score),
          percentile: null,
          weights: {},
          generatedAt: result.generatedAt,
        });
        return;
      }
      if (data.status === "failed") {
        setView({ phase: "error", message: data.error ?? "The scan failed." });
        return;
      }
      setView({
        phase: "queued",
        sub: (data.status as "pending" | "in_progress") ?? "pending",
        progress: data.progress ?? null,
      });
    }
  }

  // Does the actual POST + follow-up poll, but -- deliberately -- never
  // resets `view` to "queued" itself. The mount effect relies on `view`
  // already starting there (see the useState initializer above) so it never
  // needs to setState synchronously from within an effect; the "rescan"/
  // "try again" buttons reset `view` themselves before calling this, from a
  // click handler rather than an effect.
  async function runScan() {
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setView({ phase: "error", message: data.error ?? "Something went wrong." });
        return;
      }
      if (data.status === "completed") {
        const result = data as SerializedBuildscoreResult;
        setView({
          phase: "ready",
          result,
          tier: scoreTierClient(result.score),
          percentile: null,
          weights: {},
          generatedAt: result.generatedAt,
        });
        return;
      }
      poll();
    } catch {
      setView({ phase: "error", message: "Couldn't reach the scoring service." });
    }
  }

  function startScan() {
    setView({ phase: "queued", sub: "pending", progress: null });
    runScan();
  }

  useEffect(() => {
    // Genuine fetch-on-mount: resume polling (or kick off the first scan)
    // for the server-supplied initial state, exactly once. `cancelled`
    // (set on unmount, above) guards every setState these reach, so this
    // is the safe, standard "subscribe to an external system" pattern the
    // rule's own message describes -- not an accidental render loop.
    if (initial.status === "none") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runScan();
    } else if (initial.status === "pending" || initial.status === "in_progress") {
      poll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (view.phase === "queued") {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-3 py-24 text-center">
        <p className="font-condensed text-2xl font-semibold">@{username}</p>
        <p className="text-sm font-medium text-muted-foreground">
          {view.sub === "in_progress" ? "reading their history…" : "queued…"}
        </p>
        {view.progress && view.progress.total > 0 && (
          <div className="mt-1 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${Math.min(100, (view.progress.processedIndex / view.progress.total) * 100)}%` }}
              transition={{ duration: 0.4, ease: EASE }}
            />
          </div>
        )}
      </div>
    );
  }

  if (view.phase === "error") {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4 py-24 text-center">
        <p className="font-condensed text-2xl font-semibold">@{username}</p>
        <p className="text-sm text-muted-foreground">{view.message}</p>
        <div className="flex flex-col items-center gap-3">
          <ShimmerButton
            type="button"
            onClick={startScan}
            background="var(--primary)"
            shimmerColor="var(--dim-finishing)"
            className="h-10 gap-1.5 px-6 text-sm font-semibold text-primary-foreground"
          >
            try again
          </ShimmerButton>
          <p className="text-xs text-muted-foreground">or run the CLI instead:</p>
          <CopyCommand command={`buildscore score ${username} --pretty`} />
        </div>
      </div>
    );
  }

  const { result, tier, percentile, weights, generatedAt } = view;

  return (
    <div className="w-full max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex flex-col items-center gap-1 text-center"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          @{result.username}&apos;s buildscore
        </p>
        <div className="flex items-center gap-3">
          <span className="font-condensed text-6xl font-semibold tabular-nums">
            {result.score}
            <span className="text-2xl text-muted-foreground"> / 100</span>
          </span>
          <span className={cn("rounded-full px-3 py-1 text-sm font-bold", TIER_STYLE[tier])}>{tier}</span>
        </div>
        {percentile !== null && (
          <p className="mt-1 text-sm text-muted-foreground">
            better than <span className="font-semibold text-foreground">{percentile}%</span> of scanned builders
          </p>
        )}
        {generatedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            last scanned {timeAgo(generatedAt)} ·{" "}
            <button type="button" onClick={startScan} className="underline underline-offset-2 hover:text-foreground">
              rescan
            </button>
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
        className="mt-8 rounded-[2rem] border border-border bg-card p-7 shadow-[0_18px_40px_-16px_oklch(0.3_0.05_45_/_0.35)] sm:p-10"
      >
        <div className="space-y-4">
          {DIM_ORDER.map((key) => {
            const value = result.vector[key];
            if (value === null) return null;
            const weight = weights[key];
            return (
              <div key={key}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="font-condensed text-sm font-semibold">{DIM_LABEL[key]}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold tabular-nums text-foreground">{Math.round(value)}</span>
                    {weight !== undefined && (
                      <span className="text-[10px] text-muted-foreground">{weight}%</span>
                    )}
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn("h-full rounded-full", DIM_BG[key])}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                    transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-4">
          <Stat label="projects started" value={result.stats.projectsStarted} />
          <Stat label="shipped" value={result.stats.shippedProjects} />
          <Stat label="completion rate" value={`${Math.round(result.stats.completionRate)}%`} />
          <Stat
            label="longest streak"
            value={result.stats.longestStreakDays > 0 ? `${result.stats.longestStreakDays}d` : "—"}
          />
        </div>
      </motion.div>

      {result.repos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
          className="mt-8"
        >
          <p className="font-condensed text-lg font-semibold">most active repos</p>
          <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
            {[...result.repos]
              .sort((a, b) => b.activeness - a.activeness)
              .slice(0, 8)
              .map((repo) => (
                <div key={repo.name} className="flex flex-col gap-1.5 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-mono text-sm font-medium">{repo.name}</span>
                    <span className="shrink-0 text-xs capitalize text-muted-foreground">{repo.label}</span>
                  </div>
                  {repo.acid?.summary && (
                    <p className="text-xs leading-relaxed text-muted-foreground">{repo.acid.summary}</p>
                  )}
                </div>
              ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="mt-10 flex flex-col items-center gap-3"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
        >
          get your own score
          <ArrowRight className="size-3.5" />
        </Link>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3" />
          see the full leaderboard
        </Link>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <span className="font-condensed text-xl font-semibold tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

// Client-side fallback tier computation for scans that complete while the
// page is already open (the server only computes tier/percentile/weights
// for the initial, pre-rendered state) -- mirrors serialize.ts's scoreTier
// without importing it (that module also pulls in variables.ts, which stays
// server-only by convention). Percentile/weights are intentionally left
// out here: a full page reload (e.g. hitting "rescan" from a stale link)
// picks them up from the server.
function scoreTierClient(score: number): Tier {
  if (score >= 90) return "S+";
  if (score >= 75) return "S";
  if (score >= 60) return "A";
  if (score >= 45) return "B";
  return "C";
}
