"use client";

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

const EASE = [0.16, 1, 0.3, 1] as const;

const DIMENSIONS = [
  { label: "Velocity", value: 82, weight: 20 },
  { label: "Finishing", value: 91, weight: 20 },
  { label: "Iteration", value: 64, weight: 15 },
  { label: "Consistency", value: 77, weight: 10 },
  { label: "Ambition", value: 88, weight: 15 },
  { label: "Quality", value: 70, weight: 10 },
  { label: "Efficiency", value: 73, weight: 10 },
];

const OVERALL = Math.round(
  DIMENSIONS.reduce((sum, d) => sum + d.value * d.weight, 0) / 100
);

function ScoreRing({ score }: { score: number }) {
  const size = 128;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative flex size-32 shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="fill-none stroke-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          className="fill-none stroke-foreground"
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - score / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.3, ease: EASE }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-semibold tabular-nums">{score}</span>
        <span className="text-[11px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function DimensionBar({
  label,
  value,
  weight,
  delay,
}: {
  label: string;
  value: number;
  weight: number;
  delay: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {value}
          <span className="text-muted-foreground/60"> · {weight}% weight</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-foreground"
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay, ease: EASE }}
        />
      </div>
    </div>
  );
}

export function ScorePreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE }}
      className="w-full"
    >
      <Card className="relative mx-auto max-w-2xl overflow-hidden">
        <BorderBeam
          size={90}
          duration={8}
          colorFrom="var(--foreground)"
          colorTo="var(--muted-foreground)"
        />
        <CardHeader className="border-b px-6 pb-4">
          <Badge variant="outline" className="mb-2 gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Gauge className="size-3" />
            Sample output
          </Badge>
          <CardTitle className="text-base">octocat&apos;s Builder Vector</CardTitle>
          <CardDescription>
            Computed from full GitHub history — commits, releases, and code churn — not the
            contribution graph.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 px-6 pt-2 pb-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <ScoreRing score={OVERALL} />
          <div className="grid gap-3.5">
            {DIMENSIONS.map((d, i) => (
              <DimensionBar key={d.label} {...d} delay={0.1 + i * 0.06} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
