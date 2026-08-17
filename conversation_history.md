# Conversation History

Running summary of what we've discussed and decided, so context carries over
between sessions instead of getting re-derived (or lost) every time. Newest
entry on top. Check this before assuming there's no prior context on
something.

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
