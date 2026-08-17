"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Sticker({
  children,
  className,
  rotate = -4,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  rotate?: number;
  delay?: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85, rotate: rotate * 2 }}
      animate={{ opacity: 1, scale: 1, rotate }}
      transition={{ duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ rotate: 0, scale: 1.06 }}
      className={cn(
        "absolute hidden select-none whitespace-nowrap rounded-2xl border border-border bg-card px-3.5 py-2 font-condensed text-sm font-medium text-foreground shadow-[0_10px_20px_-8px_oklch(0.3_0.05_45_/_0.35)] sm:block",
        className
      )}
    >
      {children}
    </motion.span>
  );
}
