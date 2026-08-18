# Design

<!-- impeccable:design-doc -->

## World: The Friend In Your Texts (folk.com-referenced)

Buildscore reads like a friend texting your own stats back to you — warm, confident, a
little chaotic — not a dashboard, not an instrument panel. This replaced two prior passes
(a motorsport "live timing tower" and an architectural blueprint) that both read as
competent-but-generic dev-tool registers; the user pointed at **folk.com** directly as the
brief, and this build matches that reference rather than rolling a fresh direction. When a
named reference overrides the process, that's expected — the brief wins.

## Color strategy

**Full palette over a warm, never-neutral ground.** Light mode is warm cream daylight; dark
mode is a cozy dusk-brown, not a cold black flip — both carry real hue in the base tokens,
same principle as the prior two passes, different temperature (warm cream/brown here vs.
warm charcoal or cyanotype blue before).

- Seven Builder Vector dimensions keep seven distinct "crayon" inks (red, gold, olive,
  green, teal-blue, orange, rose) — **no purple**, a standing constraint from the very first
  redesign round that still applies to every future pass regardless of world.
- `--emphasis` (a warm terracotta/rust) is new: the one color reserved for highlighting a
  key phrase inside body copy (see the hero headline), mirroring folk's own emphasis-word
  treatment. Don't reuse it as a dimension color — it's specifically the "highlighted word"
  role.
- A full-bleed soft painterly gradient (peach → dusty blue-green, `BackgroundFX.tsx`) sits
  behind the whole page — atmosphere, not a hero-only effect.

## Typography

- **Fredoka** (`--font-condensed`, weights 500-700) — the display voice everywhere: nav
  wordmark, all headings, the score numeral, sticker text. Genuinely rounded terminals,
  matches folk's chunky friendly display type. This is the world's signature choice; don't
  swap it back to a condensed/technical face without a real reason.
- **Geist Sans** (`--font-sans`) — body paragraphs only.
- **Geist Mono** (`--font-geist-mono`) — the CLI fallback command display only; this world
  has no other "technical readout" content, unlike the prior two passes.
- Voice: UI chrome (buttons, badges, section headings, sticker copy) is lowercase and
  casual. Established factual/product copy (the hero descriptive paragraph, dimension
  names) was kept word-for-word — only casing/emphasis changed, not content.

## Components

- `ScoreCard.tsx` (replaces the blueprint-era `DrawingSheet.tsx`) — a large rounded-3xl
  card, soft offset+blur shadow (real depth, not decoration), a filled circular score badge,
  and rounded-pill progress bars per dimension in that dimension's ink color. Slight
  `rotate: -1deg` on the whole card for a "placed on the desk" feel.
- `HowItWorks.tsx` — completely reimagined as a mock iMessage-style thread ("yo what's your
  github handle" → "@octocat" → …) inside a rounded card, rather than a 3-card icon grid
  (the previous two passes both used cards-of-icon+heading+text or a numbered notes list;
  this is deliberately different, and ties into folk's own "texting" mechanic without
  copying folk's actual content). Bubble content can be edited freely — it's illustrative
  copy, not established product copy — but keep the format (bot/you exchange, last message
  bold) since that's the bit doing the work.
- `Sticker.tsx` — small reusable rotated note component (rounded-2xl, soft shadow, border)
  for the scattered hero callouts. `hidden sm:block` — stickers are a desktop flourish, they
  don't try to survive small viewports and shouldn't be forced to.
- `SiteHeader.tsx` / `SiteFooter.tsx` — solid (non-blurred) background, fully rounded
  interactive elements (buttons, theme toggle) matching the pill language. On scroll, the
  sticky header gains a subtle border + soft shadow (`transition-shadow`) — an elevation
  signal, not a redesign of the flat resting state.
- `BuildscoreMark` (`icons.tsx`) — the logomark, used in the header, footer, `HowItWorks`'
  chat avatar, and `app/icon.tsx` (favicon). An outlined rounded square (a sketch, an idea)
  offset against a solid rounded square (the same shape, actually built) — a direct glyph
  for "making things exist," not a bar-chart/growth cliché, a lettermark ("B"), or a generic
  icon-library glyph. Replaced first a placeholder "B" monogram, then a three-ascending-bars
  version that read as too generic/analytics-dashboard-y.
- `BackgroundFX.tsx` — layered soft `radial-gradient`s only, no grid, no blobs-with-blur
  physics, no scanline. Purely atmospheric.

## Radius & shape language

`--radius: 1.25rem` (up from 0.25rem in the blueprint pass) — this world is soft and rounded
everywhere: pill buttons and inputs (`rounded-full`), large-radius cards (`rounded-[2rem]`
on the biggest surfaces). No sharp rectilinear corners anywhere on purpose.

## Motion

- Stickers pop in with a small overshoot ease (`[0.34, 1.56, 0.64, 1]`) and a slight rotate
  correction — a "landing" feel, not a fade.
- `ScoreCard` and chat bubbles keep the established count-up / stagger-reveal patterns from
  earlier passes (`useCountUp`, per-row/per-bubble stagger) — that mechanic survived the
  visual rebuild because it's a good mechanic, not because it's tied to any one world.

## What NOT to do

- **No purple, ever** — standing constraint since the first redesign round.
- Don't reintroduce a technical/instrument register (blueprint linework, timing-tower
  splits, monospace-as-costume) — two prior passes tried variations on "credible dev
  instrument" and both were explicitly rejected as generic/unoriginal. This world's answer
  to "credible for developers" is personality and specificity, not technical chrome.
- Don't flatten the shadows back to zero or the radius back to sharp corners — that's the
  blueprint world's language, not this one's.
- Don't over-fill the hero with stickers on mobile — they're intentionally hidden below
  `sm:`, not shrunk to fit.
- Sample data stays labeled as sample (`sample output` badge, `@octocat`) — nothing on the
  marketing page is live user data.
- No eyebrow/kicker label above a heading (a small pill or line sitting above the H1 just to
  restate the brand or section topic). The hero briefly had a "Buildscore" pill above the H1
  — removed; the heading carries its own weight.
