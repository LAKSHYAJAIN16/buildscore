"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { formatPublishedDate, sortedPosts } from "@/lib/blog/posts";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: EASE },
  }),
};

const POSTS = sortedPosts();

export default function BlogPage() {
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
            blog
          </motion.h1>

          {POSTS.length === 0 ? (
            <motion.p
              initial="hidden"
              animate="visible"
              custom={0.1}
              variants={fadeUp}
              className="mt-5 text-lg leading-8 text-muted-foreground"
            >
              Nothing published yet. Check back soon.
            </motion.p>
          ) : (
            <motion.ul
              initial="hidden"
              animate="visible"
              custom={0.1}
              variants={fadeUp}
              className="mt-10 divide-y divide-border border-y border-border"
            >
              {POSTS.map((post) => (
                <li key={post.slug} className="py-6">
                  <Link href={`/blog/${post.slug}`} className="group">
                    <p className="font-condensed text-xl font-semibold underline-offset-4 group-hover:underline">
                      {post.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatPublishedDate(post.publishedAt)}
                    </p>
                    <p className="mt-2 text-base leading-7 text-muted-foreground">{post.excerpt}</p>
                  </Link>
                </li>
              ))}
            </motion.ul>
          )}
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
