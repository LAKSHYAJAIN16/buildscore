"use client";

import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { ScorePreview } from "./components/ScorePreview";
import { HowItWorks } from "./components/HowItWorks";
import { CopyCommand } from "./components/CopyCommand";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: EASE },
  }),
};

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex flex-col items-center gap-2 text-center"
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {eyebrow}
      </span>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
    </motion.div>
  );
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (username.trim()) setSubmitted(true);
  }

  return (
    <>
      <SiteHeader />

      <main className="flex flex-1 flex-col items-center">
        <section className="flex w-full flex-col items-center px-6 pb-20 pt-20 text-center sm:pt-28">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
            <Badge variant="outline" className="gap-1.5 py-1 text-muted-foreground">
              <Sparkles className="size-3" />
              How good are you at making things exist?
            </Badge>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0.1}
            variants={fadeUp}
            className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl"
          >
            Buildscore
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.2}
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
            custom={0.3}
            variants={fadeUp}
            onSubmit={handleSubmit}
            className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row"
          >
            <Input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setSubmitted(false);
              }}
              placeholder="github-username"
              className="h-11 rounded-full px-5 text-sm"
            />
            <ShimmerButton
              type="submit"
              background="#18181b"
              className="h-11 gap-1.5 px-6 text-sm font-medium shadow-lg shadow-black/10"
            >
              Get your score
              <ArrowRight className="size-3.5" />
            </ShimmerButton>
          </motion.form>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.35}
            variants={fadeUp}
            className="mt-4 text-xs text-muted-foreground"
          >
            Free · Open source · No signup required
          </motion.div>

          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex flex-col items-center gap-2"
            >
              <p className="text-sm text-muted-foreground">
                Web scoring is coming soon — for now, run the CLI:
              </p>
              <CopyCommand command={`buildscore score ${username.trim()} --pretty`} />
            </motion.div>
          )}
        </section>

        <section className="flex w-full flex-col items-center gap-10 px-6 py-20">
          <SectionHeading
            eyebrow="What you get"
            title="A Builder Vector, not a leaderboard number"
          />
          <ScorePreview />
        </section>

        <section className="flex w-full flex-col items-center gap-10 px-6 py-20">
          <SectionHeading eyebrow="How it works" title="Three steps, ten seconds" />
          <HowItWorks />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
