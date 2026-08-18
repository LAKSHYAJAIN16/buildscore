// Microgrants program — v0 content and placeholder numbers.
//
// Nothing here is wired to a real backend yet: there is no submission form,
// no database table, no review flow. This file exists so that when the real
// business decisions (funding amount, cohort size, cadence, eligibility bar)
// get made, updating the page is a one-file edit instead of a rewrite. See
// microgrants.md (gitignored, repo root) for the full planning doc these
// numbers come from.

// Minimum Buildscore required to apply, once applications open. A
// placeholder, not a researched figure -- picked as roughly the CLI's
// existing "A tier" cutoff (SCORE_TIER_A = 60 in variables.py) plus some
// margin, so it reads as "solidly demonstrated," not maximally exclusive.
//
// Unlike variables.py/variables.ts, this number is meant to be public --
// eligibility criteria has to be visible for applicants to know if they
// qualify, so there's no anti-gaming reason to hide it.
export const MIN_BUILDSCORE_THRESHOLD = 65;

// Per-grantee amount and cohort size. Both placeholders.
export const GRANT_AMOUNT_USD = 2_500;
export const COHORT_SIZE = 8;
export const COHORT_CADENCE = "quarterly";

export const PROGRAM_TAGLINE = "we fund builders who've already proven they ship";

export const PROGRAM_DESCRIPTION =
  "Buildscore measures whether someone can actually turn an idea into shipped software. " +
  "This program puts money behind that signal: a small, no-strings cohort grant for builders " +
  "who've already demonstrated they finish what they start.";

/** Illustrative only -- no cohort has been funded yet. Never render this
 * without a label making that explicit (same "sample output" honesty rule
 * ScoreCard.tsx follows for its @octocat example). */
export interface DemoGrantee {
  project: string;
  handle: string;
  oneLiner: string;
}

export const DEMO_COHORT: DemoGrantee[] = [
  {
    project: "packrat",
    handle: "@rlin_dev",
    oneLiner: "a dependency-diffing tool that flags breaking changes before you upgrade",
  },
  {
    project: "sidecar",
    handle: "@mvasquez",
    oneLiner: "a lightweight background-job runner for single-server side projects",
  },
  {
    project: "fieldnotes",
    handle: "@kchen_builds",
    oneLiner: "offline-first note-taking for researchers doing fieldwork with no signal",
  },
];
