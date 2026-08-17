"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Gauge } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const DIMENSIONS = [
  { code: "S1", label: "Velocity", value: 82, weight: 20, median: 61 },
  { code: "S2", label: "Finishing", value: 91, weight: 20, median: 58 },
  { code: "S3", label: "Iteration", value: 64, weight: 15, median: 55 },
  { code: "S4", label: "Consistency", value: 77, weight: 10, median: 62 },
  { code: "S5", label: "Ambition", value: 88, weight: 15, median: 59 },
  { code: "S6", label: "Quality", value: 70, weight: 10, median: 64 },
  { code: "S7", label: "Efficiency", value: 73, weight: 10, median: 60 },
] as const;

const OVERALL = Math.round(
  DIMENSIONS.reduce((sum, d) => sum + d.value * d.weight, 0) / 100
);

type Tier = "purple" | "green" | "amber";

function tierOf(value: number): Tier {
  if (value >= 85) return "purple";
  if (value >= 70) return "green";
  return "amber";
}

const TIER_TEXT: Record<Tier, string> = {
  purple: "text-sector-purple",
  green: "text-sector-green",
  amber: "text-sector-amber",
};

const TIER_BG: Record<Tier, string> = {
  purple: "bg-sector-purple",
  green: "bg-sector-green",
  amber: "bg-sector-amber",
};

function useCountUp(target: number, delayMs: number, active: boolean) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const duration = 850;
    let raf: number;
    const start = performance.now() + delayMs;

    function tick(now: number) {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, delayMs]);

  return value;
}

function OverallTile({ active }: { active: boolean }) {
  const tier = tierOf(OVERALL);
  const displayScore = useCountUp(OVERALL, 100, active);

  return (
    <div className="flex w-full shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 px-6 py-5 sm:w-40">
      <span className="flex items-center gap-1.5 font-condensed text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span className={cn("size-1.5 rounded-full animate-pulse", TIER_BG[tier])} />
        Overall
      </span>
      <span
        className={cn(
          "font-condensed text-6xl font-extrabold leading-none tabular-nums",
          TIER_TEXT[tier]
        )}
      >
        {displayScore}
      </span>
      <span className="font-mono text-[11px] text-muted-foreground">/ 100</span>
    </div>
  );
}

function SectorRow({
  dimension,
  delay,
  active,
}: {
  dimension: (typeof DIMENSIONS)[number];
  delay: number;
  active: boolean;
}) {
  const { code, label, value, weight, median } = dimension;
  const tier = tierOf(value);
  const displayValue = useCountUp(value, delay * 1000 + 250, active);
  const delta = value - median;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={active ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className="group"
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-condensed text-[11px] font-semibold tracking-wide text-muted-foreground/60">
            {code}
          </span>
          <span className="font-condensed text-sm font-semibold uppercase tracking-wide">
            {label}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/60">
            {weight}% wt
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "font-mono text-[11px] tabular-nums opacity-0 transition-opacity group-hover:opacity-100",
              delta >= 0 ? "text-sector-green" : "text-sector-amber"
            )}
          >
            {delta >= 0 ? `+${delta}` : delta} vs median
          </span>
          <span className={cn("font-mono text-sm font-semibold tabular-nums", TIER_TEXT[tier])}>
            {displayValue}
          </span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-sm bg-muted">
        <motion.div
          className={cn("h-full rounded-sm", TIER_BG[tier])}
          initial={{ width: 0 }}
          animate={active ? { width: `${value}%` } : {}}
          transition={{ duration: 0.7, delay: delay + 0.1, ease: EASE }}
        />
      </div>
    </motion.div>
  );
}

export function SplitBoard() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
      className="w-full"
    >
      <Card className="relative mx-auto max-w-2xl overflow-hidden">
        <BorderBeam
          size={90}
          duration={8}
          colorFrom="var(--sector-purple)"
          colorTo="var(--sector-green)"
        />
        <CardHeader className="border-b px-6 pb-4">
          <Badge
            variant="outline"
            className="mb-2 gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            <Gauge className="size-3" />
            Sample output
          </Badge>
          <CardTitle className="text-base">octocat&apos;s Builder Vector</CardTitle>
          <CardDescription>
            Computed from full GitHub history — commits, releases, and code churn — not the
            contribution graph.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 px-6 pt-2 pb-6 sm:flex-row sm:items-center">
          <OverallTile active={active} />
          <div className="grid w-full gap-3.5">
            {DIMENSIONS.map((d, i) => (
              <SectorRow key={d.code} dimension={d} delay={0.1 + i * 0.09} active={active} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
