"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const DIMENSIONS = [
  { key: "velocity", label: "Velocity", value: 82, weight: 20, median: 61 },
  { key: "finishing", label: "Finishing", value: 91, weight: 20, median: 58 },
  { key: "iteration", label: "Iteration", value: 64, weight: 15, median: 55 },
  { key: "consistency", label: "Consistency", value: 77, weight: 10, median: 62 },
  { key: "ambition", label: "Ambition", value: 88, weight: 15, median: 59 },
  { key: "quality", label: "Quality", value: 70, weight: 10, median: 64 },
  { key: "efficiency", label: "Efficiency", value: 73, weight: 10, median: 60 },
] as const;

const OVERALL = Math.round(
  DIMENSIONS.reduce((sum, d) => sum + d.value * d.weight, 0) / 100
);

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
    const duration = 750;
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

function DimensionRow({
  dimension,
  delay,
  active,
}: {
  dimension: (typeof DIMENSIONS)[number];
  delay: number;
  active: boolean;
}) {
  const { key, label, value, weight, median } = dimension;
  const displayValue = useCountUp(value, delay * 1000 + 250, active);
  const delta = value - median;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={active ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className="group"
    >
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="font-condensed text-sm font-semibold">{label}</span>
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "font-sans text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100",
              delta >= 0 ? "text-dim-consistency" : "text-dim-velocity"
            )}
          >
            {delta >= 0 ? `+${delta}` : delta} vs. avg
          </span>
          <span className="text-sm font-bold tabular-nums text-foreground">{displayValue}</span>
          <span className="text-[10px] text-muted-foreground">{weight}%</span>
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
    </motion.div>
  );
}

export function ScoreCard() {
  const [active, setActive] = useState(false);
  const displayScore = useCountUp(OVERALL, 100, active);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: -1 }}
      transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
      className="w-full"
    >
      <div className="mx-auto max-w-xl rounded-[2rem] border border-border bg-card p-6 shadow-[0_18px_40px_-16px_oklch(0.3_0.05_45_/_0.35)] sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
            sample output
          </span>
          <span className="text-xs text-muted-foreground">@octocat</span>
        </div>

        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-1">
            <div className="flex size-28 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_24px_-8px_oklch(0.3_0.05_45_/_0.4)]">
              <span className="font-condensed text-4xl font-bold tabular-nums leading-none">
                {displayScore}
              </span>
            </div>
            <span className="mt-1 text-xs font-semibold text-muted-foreground">buildscore</span>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            {DIMENSIONS.map((d, i) => (
              <DimensionRow key={d.key} dimension={d} delay={0.1 + i * 0.08} active={active} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
