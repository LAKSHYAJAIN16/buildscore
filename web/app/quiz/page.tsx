"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { ARCHETYPES, QUESTIONS, type ArchetypeKey } from "@/lib/quiz/data";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: EASE },
  }),
};

type Phase =
  | { step: "intro" }
  | { step: "question"; index: number; scores: Record<ArchetypeKey, number> }
  | { step: "result"; archetype: ArchetypeKey };

const ZERO_SCORES: Record<ArchetypeKey, number> = {
  sprinter: 0,
  craftsman: 0,
  hacker: 0,
  operator: 0,
  researcher: 0,
  machine: 0,
};

function pickWinner(scores: Record<ArchetypeKey, number>): ArchetypeKey {
  let winner: ArchetypeKey = "sprinter";
  let best = -1;
  for (const key of Object.keys(scores) as ArchetypeKey[]) {
    if (scores[key] > best) {
      best = scores[key];
      winner = key;
    }
  }
  return winner;
}

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>({ step: "intro" });

  function start() {
    setPhase({ step: "question", index: 0, scores: { ...ZERO_SCORES } });
  }

  function answer(archetype: ArchetypeKey) {
    if (phase.step !== "question") return;
    const scores = { ...phase.scores, [archetype]: phase.scores[archetype] + 1 };
    const nextIndex = phase.index + 1;
    if (nextIndex >= QUESTIONS.length) {
      setPhase({ step: "result", archetype: pickWinner(scores) });
    } else {
      setPhase({ step: "question", index: nextIndex, scores });
    }
  }

  function retake() {
    setPhase({ step: "intro" });
  }

  return (
    <>
      <SiteHeader />

      <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {phase.step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="text-center"
              >
                <motion.h1
                  initial="hidden"
                  animate="visible"
                  custom={0}
                  variants={fadeUp}
                  className="font-condensed text-5xl font-semibold tracking-tight sm:text-6xl"
                >
                  what&apos;s your developer type?
                </motion.h1>
                <motion.p
                  initial="hidden"
                  animate="visible"
                  custom={0.1}
                  variants={fadeUp}
                  className="mt-5 text-lg leading-8 text-muted-foreground"
                >
                  {QUESTIONS.length} questions, no signup, not scientific. Answer honestly — the
                  fun kind of dishonest doesn&apos;t count.
                </motion.p>
                <motion.button
                  initial="hidden"
                  animate="visible"
                  custom={0.2}
                  variants={fadeUp}
                  onClick={start}
                  className="mt-10 inline-flex items-center gap-1.5 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
                >
                  start the quiz
                  <ArrowRight className="size-3.5" />
                </motion.button>
              </motion.div>
            )}

            {phase.step === "question" && (
              <motion.div
                key={`q-${phase.index}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  question {phase.index + 1} of {QUESTIONS.length}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={false}
                    animate={{ width: `${((phase.index + 1) / QUESTIONS.length) * 100}%` }}
                    transition={{ duration: 0.4, ease: EASE }}
                  />
                </div>
                <h2 className="mt-6 font-condensed text-2xl font-semibold leading-snug sm:text-3xl">
                  {QUESTIONS[phase.index].prompt}
                </h2>
                <div className="mt-8 flex flex-col gap-3">
                  {QUESTIONS[phase.index].options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => answer(opt.archetype)}
                      className="rounded-2xl border border-border bg-card px-5 py-4 text-left text-base transition-colors hover:border-ring hover:bg-muted"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {phase.step === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="text-center"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  you&apos;re
                </p>
                <h1 className="mt-2 font-condensed text-4xl font-semibold tracking-tight text-emphasis sm:text-5xl">
                  {ARCHETYPES[phase.archetype].name}
                </h1>
                <p className="mt-2 font-condensed text-lg font-medium text-muted-foreground">
                  {ARCHETYPES[phase.archetype].tagline}
                </p>
                <p className="mx-auto mt-6 max-w-md text-base leading-7 text-muted-foreground">
                  {ARCHETYPES[phase.archetype].description}
                </p>

                <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
                  >
                    get your real buildscore
                    <ArrowRight className="size-3.5" />
                  </Link>
                  <button
                    onClick={retake}
                    className="text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    retake the quiz
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
