"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: EASE },
  }),
};

const TELLS = [
  { who: "GitHub", tells: "what code you've written" },
  { who: "LinkedIn", tells: "where you've worked" },
  { who: "LeetCode", tells: "if you can invert a binary tree on a whiteboard", struck: true },
  { who: "Buildscore", tells: "if you can actually ship", emphasis: true },
];

export default function ThesisPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
        <article className="w-full max-w-2xl">
          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="font-condensed text-5xl font-semibold tracking-tight text-emphasis sm:text-6xl"
          >
            f*ck leetcode
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.1}
            variants={fadeUp}
            className="mt-5 text-lg leading-8 text-muted-foreground"
          >
            Algorithm puzzles were never the point. The point was always whether you can turn an
            idea into working software. Buildscore measures that instead.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.2}
            variants={fadeUp}
            className="mt-12 space-y-5 text-base leading-8 sm:text-lg sm:leading-9"
          >
            <p className="font-condensed text-xl font-semibold sm:text-2xl">The core thesis</p>
            <p>Developer productivity is increasingly poorly represented by code output.</p>
            <p>
              A developer using coding agents might manually write 500 lines while producing the
              equivalent of 10,000 lines of useful software.
            </p>
            <p>
              The important question is no longer <em>how much code did you write?</em>
            </p>
            <p>
              It is: <strong>how effectively can you make working software exist?</strong>
            </p>
            <p className="text-muted-foreground">Buildscore attempts to quantify that ability.</p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.3}
            variants={fadeUp}
            className="mt-14"
          >
            <p className="font-condensed text-xl font-semibold sm:text-2xl">
              Everyone else measures the wrong thing
            </p>
            <dl className="mt-5 divide-y divide-border border-y border-border">
              {TELLS.map((row) => (
                <div key={row.who} className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-6">
                  <dt
                    className={`w-28 shrink-0 font-condensed text-base font-semibold ${
                      row.emphasis ? "text-emphasis" : ""
                    }`}
                  >
                    {row.who}
                  </dt>
                  <dd
                    className={
                      row.struck
                        ? "text-muted-foreground line-through decoration-2"
                        : row.emphasis
                          ? "font-semibold"
                          : "text-muted-foreground"
                    }
                  >
                    {row.tells}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-base leading-7 text-muted-foreground">
              Not a measure of how much someone codes. Not how many green squares they have. Not
              even necessarily how good a programmer they are — a measure of their demonstrated
              ability to make software exist.
            </p>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={0.4} variants={fadeUp} className="mt-14">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              get your score instead
              <ArrowRight className="size-3.5" />
            </Link>
          </motion.div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
