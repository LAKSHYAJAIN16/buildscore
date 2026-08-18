"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import {
  COHORT_CADENCE,
  COHORT_SIZE,
  DEMO_COHORT,
  GRANT_AMOUNT_USD,
  MIN_BUILDSCORE_THRESHOLD,
  PROGRAM_DESCRIPTION,
  PROGRAM_TAGLINE,
} from "@/lib/grants/data";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: EASE },
  }),
};

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const FACTS = [
  { label: "grant", value: usd.format(GRANT_AMOUNT_USD) },
  { label: "cohort size", value: `${COHORT_SIZE} builders` },
  { label: "cadence", value: COHORT_CADENCE },
  { label: "eligibility", value: `Buildscore ${MIN_BUILDSCORE_THRESHOLD}+` },
];

export default function GrantsPage() {
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
            className="font-condensed text-5xl font-semibold tracking-tight sm:text-6xl"
          >
            microgrants
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.1}
            variants={fadeUp}
            className="mt-5 text-lg leading-8 text-muted-foreground"
          >
            {PROGRAM_TAGLINE}.
          </motion.p>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.18}
            variants={fadeUp}
            className="mt-6 text-base leading-7 text-muted-foreground"
          >
            {PROGRAM_DESCRIPTION}
          </motion.p>

          <motion.dl
            initial="hidden"
            animate="visible"
            custom={0.28}
            variants={fadeUp}
            className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-y border-border py-8 sm:grid-cols-4"
          >
            {FACTS.map((fact) => (
              <div key={fact.label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {fact.label}
                </dt>
                <dd className="mt-1 font-condensed text-xl font-semibold sm:text-2xl">
                  {fact.value}
                </dd>
              </div>
            ))}
          </motion.dl>

          <motion.div initial="hidden" animate="visible" custom={0.36} variants={fadeUp} className="mt-12">
            <p className="font-condensed text-xl font-semibold sm:text-2xl">
              applications aren&apos;t open yet
            </p>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              We&apos;re still planning the first cohort. In the meantime, the best way to
              qualify is the same as always —{" "}
              <Link href="/" className="font-semibold text-foreground underline underline-offset-4">
                get your Buildscore
              </Link>{" "}
              and keep shipping. Watch{" "}
              <a
                href="https://github.com/LAKSHYAJAIN16/buildscore"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground underline underline-offset-4"
              >
                the repo
              </a>{" "}
              for when applications open.
            </p>
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={0.44} variants={fadeUp} className="mt-14">
            <div className="flex items-center gap-2">
              <p className="font-condensed text-xl font-semibold sm:text-2xl">what a cohort could look like</p>
              <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                illustrative example
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              No cohort has been funded yet — these are made up, to show the kind of project this
              program is for.
            </p>
            <ul className="mt-5 divide-y divide-border border-y border-border">
              {DEMO_COHORT.map((g) => (
                <li key={g.handle} className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-6">
                  <span className="w-32 shrink-0 font-condensed text-base font-semibold">
                    {g.project}
                  </span>
                  <span className="text-muted-foreground">
                    {g.oneLiner} <span className="text-xs">— {g.handle}</span>
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
