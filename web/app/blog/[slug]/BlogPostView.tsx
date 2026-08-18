"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { SiteHeader } from "../../components/SiteHeader";
import { SiteFooter } from "../../components/SiteFooter";
import { formatPublishedDate, type BlogPost } from "@/lib/blog/posts";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: EASE },
  }),
};

export function BlogPostView({ post }: { post: BlogPost }) {
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
            className="font-condensed text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            {post.title}
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.1}
            variants={fadeUp}
            className="mt-4 text-sm text-muted-foreground"
          >
            {formatPublishedDate(post.publishedAt)}
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.2}
            variants={fadeUp}
            className="mt-10 space-y-5 text-base leading-8 text-foreground sm:text-lg sm:leading-9"
          >
            {post.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </motion.div>

          <motion.div initial="hidden" animate="visible" custom={0.3} variants={fadeUp} className="mt-14">
            <Link
              href="/blog"
              className="text-sm font-semibold text-foreground underline underline-offset-4"
            >
              ← all posts
            </Link>
          </motion.div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
