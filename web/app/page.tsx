"use client";

import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { ScoreCard } from "./components/ScoreCard";
import { HowItWorks } from "./components/HowItWorks";
import { CopyCommand } from "./components/CopyCommand";
import { Sticker } from "./components/Sticker";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: EASE },
  }),
};

function SectionHeading({ title }: { title: string }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="font-condensed text-3xl font-semibold tracking-tight sm:text-4xl"
    >
      {title}
    </motion.h2>
  );
}

type ScanState =
  | { phase: "idle" }
  | { phase: "polling"; status: "pending" | "in_progress" }
  | { phase: "done"; score: number }
  | { phase: "error"; message: string };

export default function Home() {
  const [username, setUsername] = useState("");
  const [scan, setScan] = useState<ScanState>({ phase: "idle" });

  async function pollUntilDone(user: string) {
    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      let data: { status?: string; score?: number; error?: string };
      try {
        const res = await fetch(`/api/scan/${encodeURIComponent(user)}`);
        data = await res.json();
        if (!res.ok) {
          setScan({ phase: "error", message: data.error ?? "Something went wrong." });
          return;
        }
      } catch {
        setScan({ phase: "error", message: "Couldn't reach the scoring service." });
        return;
      }

      if (data.status === "completed") {
        setScan({ phase: "done", score: data.score ?? 0 });
        return;
      }
      if (data.status === "failed") {
        setScan({ phase: "error", message: data.error ?? "The scan failed." });
        return;
      }
      setScan({ phase: "polling", status: (data.status as "pending" | "in_progress") ?? "pending" });
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const user = username.trim();
    if (!user) return;

    setScan({ phase: "polling", status: "pending" });
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: user }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScan({ phase: "error", message: data.error ?? "Something went wrong." });
        return;
      }
      if (data.status === "completed") {
        setScan({ phase: "done", score: data.score });
        return;
      }
      pollUntilDone(user);
    } catch {
      setScan({ phase: "error", message: "Couldn't reach the scoring service." });
    }
  }

  return (
    <>
      <SiteHeader />

      <main className="flex flex-1 flex-col items-center">
        <section className="relative flex w-full flex-col items-center overflow-hidden px-6 pb-20 pt-16 text-center sm:pt-24">
          <Sticker className="left-[6%] top-[8%]" rotate={-8} delay={0.5}>
            shipped in 3 days fr
          </Sticker>
          <Sticker className="right-[8%] top-[4%]" rotate={6} delay={0.65}>
            23 repos, 4 abandoned 💀
          </Sticker>
          <Sticker className="left-[3%] top-[52%]" rotate={5} delay={0.8}>
            green squares ≠ progress
          </Sticker>
          <Sticker className="right-[4%] top-[48%]" rotate={-7} delay={0.95}>
            matched deploy on a sunday
          </Sticker>
          <Sticker className="left-[16%] top-[80%]" rotate={-4} delay={1.1}>
            not another todo app
          </Sticker>

          <motion.span
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold"
          >
            Buildscore
          </motion.span>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0.1}
            variants={fadeUp}
            className="mt-6 max-w-2xl font-condensed text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
          >
            how good are you at{" "}
            <span className="text-emphasis">making things exist?</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.22}
            variants={fadeUp}
            className="mt-6 max-w-lg text-base leading-7 text-muted-foreground"
          >
            Not commits. Not code output. Buildscore reconstructs how you actually build from
            your GitHub history — how fast you ship, how often you finish what you start, and how
            ambitious your projects are.
          </motion.p>

          <motion.form
            initial="hidden"
            animate="visible"
            custom={0.34}
            variants={fadeUp}
            onSubmit={handleSubmit}
            className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row"
          >
            <Input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setScan({ phase: "idle" });
              }}
              placeholder="github-username"
              className="h-12 rounded-full border-border bg-card px-5 text-sm"
            />
            <ShimmerButton
              type="submit"
              background="var(--primary)"
              shimmerColor="var(--dim-finishing)"
              className="h-12 gap-1.5 px-7 text-sm font-semibold text-primary-foreground"
            >
              get your score
              <ArrowRight className="size-3.5" />
            </ShimmerButton>
          </motion.form>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.4}
            variants={fadeUp}
            className="mt-4 text-xs text-muted-foreground"
          >
            free · open source · no signup required
          </motion.div>

          {scan.phase === "polling" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex flex-col items-center gap-2"
            >
              <p className="text-sm font-medium text-muted-foreground">
                {scan.status === "in_progress" ? "reading your history…" : "queued…"}
              </p>
            </motion.div>
          )}

          {scan.phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex flex-col items-center gap-1"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {username.trim()}&apos;s buildscore
              </p>
              <p className="font-condensed text-6xl font-semibold tabular-nums">
                {scan.score}
                <span className="text-2xl text-muted-foreground"> / 100</span>
              </p>
            </motion.div>
          )}

          {scan.phase === "error" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex flex-col items-center gap-2"
            >
              <p className="text-sm text-muted-foreground">
                {scan.message} run the CLI instead:
              </p>
              <CopyCommand command={`buildscore score ${username.trim()} --pretty`} />
            </motion.div>
          )}
        </section>

        <section className="flex w-full max-w-3xl flex-col items-center gap-8 px-6 pb-20">
          <SectionHeading title="a builder vector, not a leaderboard number" />
          <ScoreCard />
        </section>

        <section className="flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-20">
          <SectionHeading title="three steps, ten seconds" />
          <HowItWorks />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
