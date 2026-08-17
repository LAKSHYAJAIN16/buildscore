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
  { code: "S1", key: "velocity", label: "Velocity", value: 82, weight: 20, median: 61 },
  { code: "S2", key: "finishing", label: "Finishing", value: 91, weight: 20, median: 58 },
  { code: "S3", key: "iteration", label: "Iteration", value: 64, weight: 15, median: 55 },
  { code: "S4", key: "consistency", label: "Consistency", value: 77, weight: 10, median: 62 },
  { code: "S5", key: "ambition", label: "Ambition", value: 88, weight: 15, median: 59 },
  { code: "S6", key: "quality", label: "Quality", value: 70, weight: 10, median: 64 },
  { code: "S7", key: "efficiency", label: "Efficiency", value: 73, weight: 10, median: 60 },
] as const;

const OVERALL = Math.round(
  DIMENSIONS.reduce((sum, d) => sum + d.value * d.weight, 0) / 100
);

const DIM_TEXT: Record<(typeof DIMENSIONS)[number]["key"], string> = {
  velocity: "text-dim-velocity",
  finishing: "text-dim-finishing",
  iteration: "text-dim-iteration",
  consistency: "text-dim-consistency",
  ambition: "text-dim-ambition",
  quality: "text-dim-quality",
  efficiency: "text-dim-efficiency",
};

const DIM_BG: Record<(typeof DIMENSIONS)[number]["key"], string> = {
  velocity: "bg-dim-velocity",
  finishing: "bg-dim-finishing",
  iteration: "bg-dim-iteration",
  consistency: "bg-dim-consistency",
  ambition: "bg-dim-ambition",
  quality: "bg-dim-quality",
  efficiency: "bg-dim-efficiency",
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
  const displayScore = useCountUp(OVERALL, 100, active);

  return (
    <div className="relative flex w-full shrink-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-border px-6 py-5 sm:w-40">
      <div className="absolute inset-0 bg-gradient-to-br from-dim-velocity/15 via-dim-finishing/10 to-dim-efficiency/15" />
      <span className="relative flex items-center gap-1.5 font-condensed text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="size-1.5 rounded-full bg-dim-velocity animate-pulse" />
        Overall
      </span>
      <span className="relative font-condensed text-6xl font-extrabold leading-none tabular-nums text-dim-finishing">
        {displayScore}
      </span>
      <span className="relative font-mono text-[11px] text-muted-foreground">/ 100</span>
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
  const { code, key, label, value, weight, median } = dimension;
  const displayValue = useCountUp(value, delay * 1000 + 250, active);
  const delta = value - median;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={active ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className="group flex items-center gap-3"
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md font-condensed text-[10px] font-bold text-white",
          DIM_BG[key]
        )}
      >
        {code}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-condensed text-sm font-semibold uppercase tracking-wide">
              {label}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/60">{weight}% wt</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "font-mono text-[11px] tabular-nums opacity-0 transition-opacity group-hover:opacity-100",
                delta >= 0 ? "text-dim-consistency" : "text-dim-velocity"
              )}
            >
              {delta >= 0 ? `+${delta}` : delta} vs median
            </span>
            <span className={cn("font-mono text-sm font-semibold tabular-nums", DIM_TEXT[key])}>
              {displayValue}
            </span>
          </div>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn("h-full rounded-full", DIM_BG[key])}
            initial={{ width: 0 }}
            animate={active ? { width: `${value}%` } : {}}
            transition={{ duration: 0.7, delay: delay + 0.1, ease: EASE }}
          />
        </div>
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
          colorFrom="var(--dim-velocity)"
          colorTo="var(--dim-quality)"
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
        <CardContent className="flex flex-col gap-6 px-6 pt-2 pb-6 sm:flex-row sm:items-start">
          <OverallTile active={active} />
          <div className="grid w-full gap-4">
            {DIMENSIONS.map((d, i) => (
              <SectorRow key={d.code} dimension={d} delay={0.1 + i * 0.09} active={active} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
