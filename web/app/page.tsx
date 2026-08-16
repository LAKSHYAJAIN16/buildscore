"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function Home() {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (username.trim()) setSubmitted(true);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center text-center">
        <motion.p
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="mb-4 text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400"
        >
          How good are you at making things exist?
        </motion.p>

        <motion.h1
          initial="hidden"
          animate="visible"
          custom={0.1}
          variants={fadeUp}
          className="text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Buildscore
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          custom={0.2}
          variants={fadeUp}
          className="mt-6 max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400"
        >
          Not commits. Not code output. Buildscore reconstructs how you
          actually build from your GitHub history — how fast you ship, how
          often you finish what you start, and how ambitious your projects
          are.
        </motion.p>

        <motion.form
          initial="hidden"
          animate="visible"
          custom={0.3}
          variants={fadeUp}
          onSubmit={handleSubmit}
          className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setSubmitted(false);
            }}
            placeholder="github-username"
            className="w-full rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Get your score
          </button>
        </motion.form>

        {submitted && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-zinc-500 dark:text-zinc-400"
          >
            Web scoring is coming soon — for now, run the CLI in this repo.
          </motion.p>
        )}

        <motion.a
          initial="hidden"
          animate="visible"
          custom={0.4}
          variants={fadeUp}
          href="https://github.com/LAKSHYAJAIN16/buildscore"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-16 text-sm text-zinc-400 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-600 dark:text-zinc-500 dark:decoration-zinc-700 dark:hover:text-zinc-300"
        >
          View the project on GitHub
        </motion.a>
      </main>
    </div>
  );
}
