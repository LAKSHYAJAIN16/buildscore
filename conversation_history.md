# Conversation History

Running summary of what we've discussed and decided, so context carries over
between sessions instead of getting re-derived (or lost) every time. Newest
entry on top. Check this before assuming there's no prior context on
something.

---

## 2026-08-17

### Backend: live scoring is now real (`web/lib/buildscore/`, `web/app/api/`)

- Built the actual web backend that computes a Buildscore live, entirely in
  TypeScript on Vercel (user's explicit call, over reusing the Python
  pipeline as a separate service) — planned via `EnterPlanMode`, approved,
  then implemented by a forked background agent. Full plan is preserved at
  `C:\Users\laksh\.claude\plans\keen-napping-hopper.md`.
- Architecture: `POST /api/scan` checks a Postgres (Neon) cache/dedup lock
  and either returns instantly (`user_scores` TTL cache, ~18h) or claims the
  scan and continues in the background via Next's `after()`; long scans
  survive Vercel's duration limits by processing repos in time-boxed chunks
  that self-continue through an internal-secret-protected
  `POST /api/scan/worker`. `GET /api/scan/[username]` polls status.
- **Caching (the user's explicit requirement — "don't repeat repos we've
  already fetched")**: `repos_cache` is keyed by repo `full_name`; if a
  repo's `pushed_at` hasn't changed since last fetch, its ~4 GitHub
  sub-resource calls (releases/languages/commit_activity/code_frequency)
  are skipped entirely and the cached data is reused.
- Security: DB-backed per-IP rate limiting, the dedup lock (never two
  concurrent scans for the same username), a shared-secret header on the
  worker route, generic `{error: "Something went wrong."}` on all
  unexpected failures (no stack traces to the client). `security.py`'s
  local-JSON-file drift check was redesigned (not ported) since a local
  file doesn't survive serverless invocations — now DB-backed and advisory.
- `quality`/`efficiency`/`ai_leverage` intentionally stay `null`, matching
  the Python CLI exactly — implementing those heuristics is still separate,
  already-tracked work (see 2026-08-16 entry below).
- Verified: `tsc --noEmit` and `eslint` both clean. **Not yet verified
  live** — no real `GITHUB_TOKEN`/`DATABASE_URL` in this dev environment,
  so the cache-hit path, the atomic `claimScanSlot` upsert SQL, and the
  chunked-continuation handoff have never round-tripped against a real
  Postgres/Vercel deploy. First real deploy should specifically watch: does
  `after()` + self-`fetch()` survive Vercel's function-freeze timing.
- Also fixed a real pre-existing bug while touching `web/.gitignore`: its
  `.env*` pattern was silently blocking `.env.example` (the committed
  template) from ever being tracked. Narrowed to `.env`/`.env.local`/
  `.env.*.local`.
- Committed as `6562444` (backend) — pushed.

### Landing page, take 3 and 4: folk.com

- The "architectural blueprint" redesign (see below) shipped, got tested
  live by the user in their own browser, and was rejected hard: "ew. make
  the design more ORIGINAL." then, with a concrete reference: **"vibey,
  Gen-Z... look at folk.com."**
- Actually navigated to folk.com and looked at it (not from memory) before
  building: warm cream/painterly-gradient background, chunky rounded
  display type, scattered rotated "sticker" text-message notes with soft
  shadows, lowercase casual copy voice, pill buttons everywhere, an
  iMessage-thread motif (folk's whole pitch is "the friend in your texts").
- Rebuilt to match: Fredoka (rounded display font) replacing the
  blueprint's Titillium Web; warm cream daylight / cozy dusk-brown-at-night
  palette replacing cyanotype blue; `--radius` back up to `1.25rem` (pills,
  large rounded cards) from the blueprint's flat `0.25rem`; a new
  `Sticker.tsx` component for the scattered hero callouts
  ("shipped in 3 days fr", "23 repos, 4 abandoned 💀", etc. — original
  buildscore-flavored copy, not folk's); `HowItWorks` reimagined as a mock
  iMessage thread instead of a card grid or notes list; `ScoreCard.tsx`
  (replacing the blueprint's `DrawingSheet.tsx`) as a rounded card with
  pill progress bars. The 7 no-purple dimension colors carried over,
  recolored warmer.
- **This landed** — user reaction: "MUCH, MUCH better. not perfect but
  definitely a start." Nothing further requested yet as of end of session.
- `web/DESIGN.md` rewritten again to document this world and explicitly
  rule out reverting to any "technical/instrument" register (timing tower,
  blueprint) — two passes already tried variations on that and both were
  rejected as generic.
- Committed as `983c22a` (frontend) — pushed.
- Real, unresolved risk from working in parallel with the backend fork:
  both touched `web/app/page.tsx` concurrently. The fork's functional
  logic (`ScanState`, `handleSubmit`, `pollUntilDone`) was preserved and
  is now wired into the new folk-styled JSX — worth a careful read of
  `page.tsx` next session before assuming it's untouched.

### Landing page, take 2 (superseded within this same session)

- Between the rainbow redesign (2026-08-16) and folk.com, there was a full
  third pass at "architectural blueprint" — cyanotype blueprint blue +
  white linework (dark) / graphite-on-white CAD plot (light), Titillium Web
  type, 7 dimension colors as "CAD layer inks," SVG dimension-line data
  rows that drew themselves in on load. Went through the `impeccable`
  skill's full direction-round ceremony (rolled "Air Traffic Control
  Radar," picked "Architectural Blueprint" as Impeccable's own pick
  instead). **This was never committed** — the user rejected it in the
  browser before it reached a commit point, so it left no trace in git
  history, only in this log. Worth remembering so "blueprint" isn't
  re-suggested as a fresh idea later.

### Open threads / next steps

- [ ] First real deploy: provision Neon Postgres + Vercel env vars
      (`GITHUB_TOKEN`, `DATABASE_URL`, `INTERNAL_WORKER_SECRET`,
      `APP_BASE_URL`), run `drizzle-kit migrate`, and actually exercise the
      scan flow end-to-end against real GitHub data — this is unverified.
- [ ] `quality`/`ai_leverage` v0 heuristics still not implemented (carried
      over from 2026-08-16, unchanged).
- [ ] `efficiency` still intentionally deferred.
- [ ] Landing page: no further design changes requested as of end of
      session, but the user's "not perfect" caveat on folk.com direction
      suggests more polish may be wanted later — don't assume it's final.
- [ ] The original full design vision doc (pasted 2026-08-16) still hasn't
      been saved into the repo as e.g. `docs/VISION.md` — still open,
      still just offered, never confirmed.

---

## 2026-08-16

### Landing page (`web/`)

- Redesigned `web/`'s landing page twice in this session:
  1. First pass: rebuilt the sample Builder Vector card as a "live timing
     tower" (motorsport split-board metaphor) — purple/green/amber tier
     colors, Barlow Condensed instrument type, near-black/near-white base.
     Went through the `impeccable` skill's direction-round process; picked
     "Live Timing Tower" over a rolled "trading card grading slab" concept.
  2. Rejected by user: "no purple anywhere... i don't want it to be black
     and white." Rebuilt the color system as a genuine 7-hue rainbow (coral,
     gold, lime, green, teal, blue, rose — no purple/violet), one real color
     per Builder Vector dimension, filling actual surface area (chips, bars,
     gradient CTA, full-bleed background wash) instead of thin accents on a
     neutral ground. Also warmed the base background/foreground tokens in
     both themes so they don't read neutral gray-black/white even before
     accent colors are added.
- User then said they want an **entirely different design** eventually, but
  said "that's ok" — i.e. shelved for now, not asking for another redesign
  immediately.
- `web/PRODUCT.md` and `web/DESIGN.md` were created (via the `impeccable`
  skill) to record product truth and the current visual system. `DESIGN.md`
  currently documents the rainbow palette; it will need a rewrite whenever
  the "entirely different design" pass happens.
- Key files: `web/app/globals.css` (color tokens), `web/app/components/
  SplitBoard.tsx` (the sample score card), `web/app/components/
  BackgroundFX.tsx`, `web/app/layout.tsx` (direction-contract comment).
- Both redesign passes are committed and pushed to `main`
  (`38cd4e7`, `8a5a565`).

### Build score algorithm (`src/buildscore/`)

- Reviewed current state: `velocity`, `finishing`, `iteration`,
  `consistency`, `ambition` are implemented in `scoring.py`. `quality` and
  `efficiency` are stubbed to `None` (excluded from the score via
  renormalization in `compute_score`). `ai_leverage` exists as a field on
  `BuilderVector` but has **no weight at all** in `DIMENSION_WEIGHTS` and
  isn't computed.
- User shared the original Buildscore design doc in full (not previously
  present anywhere in the repo — code comments reference "the original
  design doc" but no such file existed). Core points from it:
  - **Core thesis**: code output (LOC, commits) is a bad productivity
    signal in the AI-coding era; Buildscore measures *execution* — the
    ability to turn ideas into shipped, working software.
  - **Builder Vector**: `B = (V, F, I, C, A, Q, L, E)` — velocity,
    finishing, iteration, consistency, ambition, quality, AI leverage,
    efficiency. Initial weights: `0.20V + 0.20F + 0.15I + 0.10C + 0.15A +
    0.10Q + 0.10E` (matches what's already in `variables.py`
    `DIMENSION_WEIGHTS`, minus `L`/ai_leverage, which the doc treats as
    eventually a major differentiator but doesn't include in the Phase-4
    MVP weight list either).
  - **AI Leverage** is framed as one of Buildscore's *defining* features
    — not "cheating," but leverage. Doc's proxies: code-generation
    patterns, commit structure, AI config files, agent metadata,
    unusually large changes, subsequent human modification, generated-code
    survival after time.
  - **Technical Ambition**: should detect real architectural signals
    (distributed systems, databases, concurrency, ML, compilers, infra,
    crypto, etc.), not just a hardcoded "hard languages" list (current
    `AMBITIOUS_LANGUAGES` heuristic is explicitly called a crude
    placeholder in both `variables.py` and `README.md`).
  - **Semantic Git Analysis** (AST parsing, LLM-assisted diff
    classification into FEATURE/BUGFIX/REFACTOR/etc.) is described as
    "the technical heart of Buildscore" but is explicitly Phase 2 —
    README already says this ("no semantic diff/AST analysis yet").
  - **Anti-Gaming**: downweight commit spam, README-only repos, generated
    repos, forks, dependency bumps, formatting-only changes, vendored
    code. This is why `variables.py` (exact thresholds) is gitignored —
    same reasoning the doc's "Anti-Gaming" section gives.
  - Also covers: builder archetypes (Sprinter/Craftsman/Hacker/Operator/
    Researcher/Machine), a "Build Graph" visualization, an annual
    "Build Wrapped" report, public profiles (`buildscore.dev/username`),
    badges, leaderboards, and a longer-term "learned model" direction
    (train on outcomes like stars/funding/employment rather than a
    manually-weighted formula).
  - MVP phasing in the doc: (1) GitHub ingestion, (2) repo classification,
    (3) lifecycle reconstruction, (4) scoring, (5) public profiles. Note:
    an earlier commit (`b73a66a`, "Replace stage classification with
    continuous activeness score") already deliberately moved *away* from
    the doc's categorical lifecycle stages (`Experiment → Active → MVP →
    Shipped → Maintained → Dormant → Abandoned`) toward a continuous
    0-100 `activeness` score in `lifecycle.py` — a real divergence from
    the doc worth keeping in mind, not an oversight.
- **My recommendation** (given, not yet implemented): prioritize two v0
  heuristics next, both doable without semantic/AST analysis:
  1. **Quality** — churn stability from `code_frequency` (already
     fetched, free) + one repo-tree API call per meaningful repo for
     tests/CI/README/LICENSE presence.
  2. **AI Leverage** — one tree-listing call per repo for AI tooling
     config files (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, Copilot
     instructions, etc. — we're already dogfooding this pattern in
     `web/`) + a bounded sample of recent commits (new API call type,
     `/commits`, not currently fetched at all) regexed for AI co-author
     trailers. Prioritized over Quality-as-originally-scoped because
     `ai_leverage` is currently the most neglected dimension relative to
     how central it is to the doc's actual thesis.
  - **Efficiency** recommended to stay deferred — not in the doc's own
    Phase-4 MVP list either, and its formula needs feature-velocity data
    that depends on the semantic diff pipeline (Phase 2).
- Offered to save the pasted design doc into the repo (e.g.
  `docs/VISION.md`) since code comments reference it but it doesn't exist
  as a file yet. **Not yet confirmed/done** — open item.

### Open threads / next steps

- [ ] Decide whether to save the full design doc into the repo (where —
      `docs/VISION.md`?) and do it.
- [ ] Implement `quality` v0 heuristic in `scoring.py` + weights already
      exist in `variables.py`/`variables.example.py`.
- [ ] Implement `ai_leverage` v0 heuristic — needs a new `DIMENSION_WEIGHTS`
      entry (currently absent) plus new GitHub client methods (repo tree
      listing, commit list with messages).
- [ ] `efficiency` intentionally deferred, not an open task right now.
- [ ] Landing page: user wants an eventually-"entirely different" design
      direction — not scheduled, just noted as wanted.
