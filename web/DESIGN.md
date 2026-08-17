# Design

<!-- impeccable:design-doc -->

## World: Live Timing Tower — Rainbow Splits

The Builder Vector reads like a motorsport live-timing screen: sectors, splits, count-up
reveals. Structurally unchanged from the first pass, but the color system was rejected by the
user (explicitly: no purple, and the neutral-ground-with-accent-dots approach still read as
"black and white") and rebuilt as a genuine seven-hue rainbow, one real color per dimension,
filling actual surface area — chips, bars, numerals, background wash — not thin accent lines
on a near-neutral ground.

## Color strategy

**Full palette / Drenched** — seven named dimension inks, no purple/violet anywhere in the
palette (deliberately excluded), plus a warm-tinted (never neutral gray) ground and a
full-bleed multi-hue gradient wash behind the hero:

- `--dim-velocity` — coral/red-orange (hue ~28)
- `--dim-finishing` — gold/amber (hue ~75)
- `--dim-iteration` — lime/yellow-green (hue ~122)
- `--dim-consistency` — green (hue ~155)
- `--dim-ambition` — teal/cyan (hue ~195)
- `--dim-quality` — blue (hue ~240)
- `--dim-efficiency` — rose/pink (hue ~355)

Each dimension owns its hue permanently — `SplitBoard.tsx`'s `DIM_TEXT` / `DIM_BG` maps are
the single source of truth; a future results page or share card must reuse the same
`key → color` mapping rather than reassigning colors per-view. `--border` stays hue-avoidant
(low chroma) so it visually recedes rather than competing with the score data.

Dark mode is not neutral gray-black — background/card tokens carry a warm hue (~45°) so it
reads as "warm charcoal," never "black and white" even before any accent color appears. Light
mode mirrors it as warm paper (~75° hue), not the cliché cream, not stark white. Never hardcode
hex — reference the `--dim-*` tokens (exposed as `text-dim-*` / `bg-dim-*` Tailwind utilities
via the `@theme inline` block in `app/globals.css`).

**Retired:** the original `--sector-purple/green/amber` three-tier system (tier-by-threshold
coloring). Do not reintroduce it or any purple/violet hue — both were explicit user rejections,
not stylistic preferences to weigh against other options.

## Typography

- **Barlow Condensed** (`--font-condensed`, weights 500-800) — instrument caps: nav wordmark,
  sector labels, section eyebrows, the overall grade numeral.
- **Geist Sans** (`--font-sans`) — body copy, headings outside the instrument chrome.
- **Geist Mono** (`--font-geist-mono` / `font-mono`) — all numeric readouts (scores, deltas,
  CLI command), always `tabular-nums`.

## Components

- `SplitBoard.tsx` — `OverallTile` (solid gold numeral — **not** gradient text, the detector
  flags `bg-clip-text` gradients as an AI-slop tell — on a soft multi-hue gradient *background*
  wash) beside seven `SectorRow`s. Each row gets a solid-filled colored code chip (`S1`…`S7`),
  a color-matched progress bar, and a color-matched value. Count-up animates on mount
  (`useCountUp`, first-viewport content, not scroll-triggered); hover reveals "vs median" delta
  in green (ahead) or coral (behind) — reusing `dim-consistency` / `dim-velocity` rather than
  inventing an eighth semantic color.
- `HowItWorks.tsx` — step chips: coral → blue → gold (one dimension hue per step).
- `SiteHeader.tsx` — wordmark carries a four-dot cluster (coral/blue/gold/green) instead of a
  tier triad.
- `BackgroundFX.tsx` — five soft blurred blobs, each a different dimension hue, at real visible
  opacity (0.10-0.22, higher in dark mode) — this is load-bearing for "not black and white,"
  not decoration to mute further. Plus the `sweep-line` scan animation from the first pass.
- CTA (`ShimmerButton` in `app/page.tsx`) — three-stop gradient, coral → gold → blue, the
  boldest single element on the page; this is the one place a gradient is appropriate (a
  background fill, not text).

## Motion

Unchanged from the first pass: `SplitBoard` animates on mount (first-viewport content) with
per-row stagger and a manual `requestAnimationFrame` count-up (`useCountUp`); everything else
keeps the existing `fadeUp` / `whileInView` scroll-triggered patterns.

## What NOT to do

- **No purple or violet, anywhere, in any future addition.** This was an explicit, direct user
  rejection of the first pass — not a taste call to re-litigate.
- Don't let color retreat back to thin accent lines/dots on a neutral ground — that exact
  approach (three small tier dots on a near-black/near-white base) was tried and explicitly
  rejected as still reading like "black and white." Color needs to fill real surface area:
  chips, bars, backgrounds, gradients-as-fills.
- Don't use gradient *text* (`bg-clip-text`) — flagged by `impeccable`'s detector as an AI
  tell. Gradients are fine as background fills (CTA, tile backdrop), never as the text color
  itself.
- Don't move the sample data out of "sample" framing — the `SAMPLE OUTPUT` badge and
  `octocat` label on `SplitBoard` are load-bearing; nothing here is live user data yet (see
  `PRODUCT.md` — web scoring doesn't exist).
