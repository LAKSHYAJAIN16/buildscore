"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const MESSAGES = [
  { from: "bot", text: "yo what's your github handle" },
  { from: "you", text: "@octocat" },
  { from: "bot", text: "say less — pulling every repo, release, and commit rn" },
  { from: "bot", text: "not just your green squares. all of it 👀" },
  { from: "bot", text: "ok you're a 79. velocity's actually kind of insane", bold: true },
] as const;

export function HowItWorks() {
  return (
    <div className="w-full max-w-md rounded-[2rem] border border-border bg-card p-5 shadow-[0_18px_40px_-16px_oklch(0.3_0.05_45_/_0.3)] sm:p-6">
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          B
        </span>
        <div>
          <p className="text-sm font-semibold">buildscore</p>
          <p className="text-xs text-muted-foreground">10 seconds ago</p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {MESSAGES.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.12, ease: EASE }}
            className={cn("flex", m.from === "you" ? "justify-end" : "justify-start")}
          >
            <span
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-snug",
                m.from === "you"
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm bg-muted text-foreground",
                "bold" in m && m.bold && "font-semibold"
              )}
            >
              {m.text}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
