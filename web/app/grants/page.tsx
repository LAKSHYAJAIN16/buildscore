"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

import { Input } from "@/components/ui/input";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import {
  APPLICATIONS_OPEN,
  COHORT_CADENCE,
  COHORT_SIZE,
  DEMO_COHORT,
  GRANT_AMOUNT_USD,
  MAX_PITCH_LENGTH,
  MAX_PROJECT_NAME_LENGTH,
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

type FormState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "done" }
  | { phase: "error"; message: string };

function ApplicationForm() {
  const [username, setUsername] = useState("");
  const [projectName, setProjectName] = useState("");
  const [pitch, setPitch] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot -- left empty by real visitors
  const [state, setState] = useState<FormState>({ phase: "idle" });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ phase: "submitting" });
    try {
      const res = await fetch("/api/grants/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          projectName: projectName.trim(),
          pitch: pitch.trim(),
          email: email.trim(),
          company,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: "error", message: data.error ?? "Something went wrong." });
        return;
      }
      setState({ phase: "done" });
    } catch {
      setState({ phase: "error", message: "Couldn't reach the server. Try again in a bit." });
    }
  }

  if (state.phase === "done") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="font-condensed text-lg font-semibold">application received</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          We&apos;ll review it against the current cohort and reach out at {email} either way.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="grant-username" className="text-sm font-medium">
          GitHub username
        </label>
        <Input
          id="grant-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="github-username"
          required
          className="mt-1.5 h-11 rounded-lg border-border bg-background px-4 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Needs a Buildscore of {MIN_BUILDSCORE_THRESHOLD}+ already on file —{" "}
          <Link href="/" className="underline underline-offset-2">
            get scored first
          </Link>{" "}
          if you haven&apos;t.
        </p>
      </div>

      <div>
        <label htmlFor="grant-project" className="text-sm font-medium">
          Project
        </label>
        <Input
          id="grant-project"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="what you're building"
          required
          maxLength={MAX_PROJECT_NAME_LENGTH}
          className="mt-1.5 h-11 rounded-lg border-border bg-background px-4 text-sm"
        />
      </div>

      <div>
        <label htmlFor="grant-pitch" className="text-sm font-medium">
          Pitch
        </label>
        <textarea
          id="grant-pitch"
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="what it does, and what the grant would help with"
          required
          maxLength={MAX_PITCH_LENGTH}
          rows={4}
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div>
        <label htmlFor="grant-email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="grant-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="mt-1.5 h-11 rounded-lg border-border bg-background px-4 text-sm"
        />
      </div>

      {/* Honeypot -- hidden from real visitors via CSS, not type="hidden"
          (bots that scrape form fields tend to skip actually-hidden inputs
          but still fill ones merely zero-size/invisible). Zero dimensions
          instead of an off-canvas offset so it can't ever create horizontal
          page scroll. */}
      <div className="h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
        <label htmlFor="grant-company">Company</label>
        <input
          id="grant-company"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {state.phase === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={state.phase === "submitting"}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-60"
      >
        {state.phase === "submitting" ? "sending…" : "apply"}
      </button>
    </form>
  );
}

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
            {APPLICATIONS_OPEN ? (
              <>
                <p className="font-condensed text-xl font-semibold sm:text-2xl">apply</p>
                <div className="mt-5">
                  <ApplicationForm />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
