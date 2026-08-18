// Blog posts -- the single source of truth for both /blog (the index) and
// /blog/[slug] (each post's own page, app/blog/[slug]/page.tsx). Nothing
// else needs editing to publish a post: append one object to POSTS below
// with a unique slug, and both the index card and its detail page exist
// automatically (generateStaticParams pre-renders every slug at build
// time). body is an array of paragraphs, not markdown -- no rendering
// pipeline/dependency needed for plain prose; if a future post needs real
// formatting (headings, code, links mid-paragraph), that's the point to
// introduce MDX, not before there's a real post that needs it.
//
// The three below are placeholder content, not a real backlog -- written
// to keep the blog from launching empty, per explicit instruction. Kept
// honest on purpose: each one is thesis/philosophy content in the same
// spirit as docs/VISION.md and /thesis (already-established real opinion),
// not a fabricated claim about a specific event, user, metric, or
// testimonial that didn't happen. The microgrants post is fully true --
// that program is genuinely live. Swap these for real posts as they exist.
export interface BlogPost {
  slug: string;
  title: string;
  publishedAt: string; // ISO date
  excerpt: string; // shown on the index card and as the detail page's dek
  body: string[]; // paragraphs, rendered in order on the detail page
}

export const POSTS: BlogPost[] = [
  {
    slug: "microgrants-launch",
    title: "microgrants is live",
    publishedAt: "2026-08-18",
    excerpt:
      "Starting today, we're putting some money behind the same thing Buildscore has always " +
      "measured: the ability to actually ship. If your Buildscore clears the bar, you can apply " +
      "for a small, no-strings grant toward whatever you're building next. Details and the " +
      "application are on the microgrants page.",
    body: [
      "Starting today, we're putting some money behind the same thing Buildscore has always " +
        "measured: the ability to actually ship. Not an idea, not a pitch deck — a track record " +
        "of turning things into working software.",
      "The mechanics are simple. If your Buildscore clears the bar on the microgrants page, you " +
        "can apply. No pitch competition, no multi-round interview process — a short application, " +
        "reviewed against what you've already demonstrated you can do.",
      "We don't have a big cohort planned for round one, and we're not pretending this is a lot " +
        "of money. It's meant as a small, no-strings push toward whatever you're already building " +
        "next — the same way a good commit history speaks for itself.",
    ],
  },
  {
    slug: "ai-leverage-isnt-cheating",
    title: "using AI well is a skill, not a shortcut",
    publishedAt: "2026-07-29",
    excerpt:
      "We don't dock points for AI-assisted code. The question was never how many keystrokes a " +
      "person made — it's whether they can turn an idea into something real. A developer who " +
      "ships fast with Claude or Cursor, and knows when to trust the output, when to rewrite it, " +
      "and when to ignore it entirely, is exercising real judgment. That's what our AI Leverage " +
      "dimension tries to reward.",
    body: [
      "We don't dock points for AI-assisted code. The question was never how many keystrokes a " +
        "person made — it's whether they can turn an idea into something real.",
      "There's a version of this conversation that treats AI-generated code as inherently " +
        "suspect, as if the only legitimate software is software typed by hand, line by line. We " +
        "think that's the wrong frame entirely. Nobody asks whether a developer's IDE " +
        "autocompleted too much of their code, or whether they leaned too hard on a library " +
        "instead of writing their own sorting algorithm. Leverage has always been part of the " +
        "job.",
      "What actually separates builders is judgment: knowing when generated code is right, when " +
        "it's subtly wrong, when it needs a rewrite, and when the fastest path is to throw it out " +
        "and do it yourself. A developer who ships fast with Claude or Cursor and consistently " +
        "makes those calls well is doing something real — that's what our AI Leverage dimension " +
        "tries to reward, not raw AI usage for its own sake.",
      "The heuristics we use today are still rough — mostly commit trailers and the presence of " +
        "tool config files. We know that undercounts a lot of real AI-assisted work that never " +
        "shows up in a co-authorship line. It's a v0, and it'll get sharper.",
    ],
  },
  {
    slug: "green-squares",
    title: "green squares are not progress",
    publishedAt: "2026-07-14",
    excerpt:
      "GitHub's contribution graph rewards showing up, not shipping. A repo with 400 commits and " +
      "zero users looks identical to one that changed how people work — as long as both " +
      "committed daily. We think that's backwards. Buildscore tries to measure whether something " +
      "got built, not whether someone was active.",
    body: [
      "GitHub's contribution graph rewards showing up, not shipping. A repo with 400 commits and " +
        "zero users looks identical to one that changed how people work — as long as both " +
        "committed daily.",
      "That's not a knock on GitHub; the contribution graph was never trying to measure outcomes, " +
        "just activity. The problem is what happened after: activity became a proxy for skill, " +
        "then a proxy for hireability, then something people started optimizing directly — commit " +
        "streaks kept alive with whitespace changes, README edits, anything that keeps the squares " +
        "green.",
      "We think that's backwards. The interesting question was never \"did this person write code " +
        "today\" — it's whether they can go from an idea to something that actually works, ship it, " +
        "and keep it alive afterward. Buildscore tries to measure that instead: how fast projects " +
        "go from started to shipped, how often they get finished at all, and how much gets built " +
        "and abandoned along the way.",
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function sortedPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

// new Date("2026-08-18") parses as UTC midnight, which then formats one day
// back in any timezone behind UTC -- parse the ISO date's y/m/d as local
// components instead so the displayed date always matches what's written
// above.
export function formatPublishedDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
