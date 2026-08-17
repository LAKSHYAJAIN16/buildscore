# Design

<!-- impeccable:design-doc -->

## World: Live Timing Tower

The Builder Vector reads like a motorsport live-timing screen: sectors, splits, and a
tri-color delta system, mapped onto the seven Builder Vector dimensions. Chosen via the
`impeccable` direction round (key `1417e296`) as "Impeccable's Pick" over the rolled
assignment (a trading-card grading slab). Named risk, accepted: this register is closer to
familiar dev-tool dashboards (Vercel Speed Insights, CI timing views) than the rolled
direction — traded for credibility and lower execution risk on a real product's landing page.

## Color strategy

**Full palette** (3-4 named roles) over a near-neutral instrument ground — never decorative,
always tied to score tier/delta:

- `--sector-purple` — top tier / "personal best" (value ≥ 85)
- `--sector-green` — ahead of pace (value ≥ 70)
- `--sector-amber` — behind pace / caution (value < 70)

Dark mode is the world's home ground (a control-room monitor, checked at night). Light mode
is not an afterthought — it's the same world's other physical medium: a crisp printed timing
sheet (near-white, not cream), same three inks, deepened for print contrast. Both live in
`app/globals.css` under `:root` / `.dark`; never hardcode hex — always reference
`--sector-purple` / `--sector-green` / `--sector-amber` (exposed as Tailwind
`text-sector-*` / `bg-sector-*` utilities via the `@theme inline` block).

Tier logic lives inline in `SplitBoard.tsx` (`tierOf()`) — keep any future score-tier UI
(e.g. a live results page) consistent with those same three thresholds (85 / 70) rather than
inventing new cutoffs.

## Typography

- **Barlow Condensed** (`--font-condensed`, weights 500-800) — instrument caps: nav wordmark,
  sector labels, section eyebrows, the overall grade numeral. Used wherever the UI is
  "reading like a timing tower," never for body copy.
- **Geist Sans** (`--font-sans`) — body copy, headings outside the instrument chrome.
- **Geist Mono** (`--font-geist-mono` / `font-mono`) — all numeric readouts (scores, deltas,
  CLI command). Numbers are always tabular (`tabular-nums`).

## Components

- `SplitBoard.tsx` — the sample Builder Vector, rebuilt as a split board: an `OverallTile`
  (large tier-colored numeral, pulsing status dot) beside seven `SectorRow`s. Each row
  count-up animates on mount (`useCountUp`, not scroll-triggered — this card lives in the
  first viewport) and reveals a "vs median" delta on hover. Tier color drives both the value
  text and the track-bar fill. Superseded `ScorePreview.tsx` (deleted) — its plain
  monochrome ring/bar version is retired, not a fallback.
- `HowItWorks.tsx` — step icon chips now cycle purple → green → amber (one per step) instead
  of uniform muted chips, tying the explainer back to the tri-color system.
- `SiteHeader.tsx` — wordmark carries a small purple/green/amber three-dot "status" cluster
  next to "Buildscore," the smallest possible dose of the world in permanent chrome.
- `BackgroundFX.tsx` — ambient blobs recolored to sector-purple/green/amber (low opacity);
  added a `sweep-line` vertical scan animation (`app/globals.css` keyframe) for subliminal
  "live signal" motion. Keep this subtle — it's atmosphere, not a focal element.
- CTA (`ShimmerButton` in `app/page.tsx`) uses a purple gradient
  (`var(--sector-purple)` → a deeper purple) instead of flat near-black, the one place color
  carries a primary action.

## Motion

- Entrance: existing `fadeUp`/`whileInView` patterns from the prior build are preserved for
  scroll-triggered sections (How it works, section headings).
  `SplitBoard` breaks that pattern deliberately — it animates on mount, staggered
  top-to-bottom per sector row (~90ms stagger), because it lives in the first viewport and
  must already be "clocking in" without requiring a scroll.
- Count-up numbers use a manual `requestAnimationFrame` easing loop (`useCountUp` in
  `SplitBoard.tsx`), not a Motion `animate()` call — kept dependency-free and easy to restart
  per-row with independent delays.

## What NOT to do

- Don't introduce a fourth "named" accent color — the tri-color system (purple/green/amber)
  is the whole palette; a new hue needs a new tier meaning, not decoration.
- Don't reach for gradient text, glassmorphism, or a neon-on-near-black hacker/terminal
  aesthetic — that was explicitly named and rejected as the generic-AI-landing-page rut this
  redesign exists to avoid.
- Don't move the sample data out of "sample" framing — the `SAMPLE OUTPUT` badge and
  `octocat` label on `SplitBoard` are load-bearing; nothing here is live user data yet (see
  `PRODUCT.md` — web scoring doesn't exist).
