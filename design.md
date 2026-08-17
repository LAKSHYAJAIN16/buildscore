# Design approach

A reusable design methodology, distilled from building buildscore's landing page. This isn't
tied to buildscore — it's the process and checklist to reach for on the next app too.

## The core principle: a reference beats a vibe

The single biggest lever isn't taste, it's grounding. When you have (or can get) a concrete
reference — a named site, an app, a screenshot — **actually go look at it** before designing
anything. Don't design from memory of "what that kind of site tends to look like." Open it in
a browser, screenshot it, and extract concrete facts: exact type character, exact color
temperature, exact corner radius, exact shadow treatment, exact copy voice. A vibe description
("make it vibey, Gen-Z") is a starting point, not a spec — the spec is what you see when you
actually look at folk.com (or whatever the reference is).

If there's no reference, build one by asking what the brief needs: who's the audience, what do
they need to believe, what's the one thing this page must prove. Then find the *cultural world*
that audience already lives in (not the product's category — the audience's actual life) and
borrow its visual grammar. A dev tool doesn't have to look like a dev tool.

## What actually went wrong before it went right

Useful to remember because it's the actual failure mode, not a hypothetical one:

1. **First pass** picked a strong metaphor (motorsport timing tower) but the color system was
   thin — three tier colors as small accent dots on an otherwise neutral ground. Result: "no
   purple, and it still reads as black and white." **Lesson: color has to fill real surface
   area — chips, bars, fills, backgrounds — not decorate a neutral base.**
2. **Second pass** (architectural blueprint) was well-executed and internally consistent, but
   it was still "a competent dev-tool instrument metaphor" — the same *category* of idea
   (measure/instrument/technical-drawing register) as the first pass, just a different skin.
   Rejected as unoriginal. **Lesson: originality isn't in the execution polish, it's in
   whether the underlying idea has actually been done before. Two "credible technical
   instrument" ideas in a row is one idea twice.**
3. **Third pass** got a named reference (folk.com) and matched it directly instead of
   generating a fresh concept. It landed. **Lesson: when the person you're designing for
   hands you a reference, that's not one input among many — it overrides your own process.
   Stop generating options and go build what they pointed at.**

## The checklist

Work through these deliberately. Skipping one is usually where a design ends up generic.

### 1. Color strategy — pick one, on purpose
- **Restrained**: neutrals + one accent. Safe default for task-focused UI.
- **Committed**: one saturated color owns 30-60% of the surface.
- **Full palette**: 3-7 named roles, each with a real job (not decoration).
- **Drenched**: the surface *is* the color.

Persuade/marketing surfaces can go bold. Never land on "neutral base + a few small accent
dots" — that's not actually one of the four strategies, it's what happens when you're afraid
to pick one. And never default to a cool neutral gray/black/white base — pick a *temperature*
(warm cream, cool blueprint blue, warm charcoal) even for a "neutral" ground.

### 2. Typography — a face with a point of view
Don't reach for the platform default or the model's own training-data favorites (Space
Grotesk, DM Sans, Inter-as-display, Playfair, etc. — these are what every AI-generated page
reaches for, which is exactly why they read as generic now). Pick a display face whose
character matches the world you committed to, and be able to say *why* in one sentence
("Fredoka's rounded terminals match folk's friendly chunky voice" / "Titillium Web has real
technical/engineering DNA for a blueprint world"). Body copy can stay a clean workhorse face —
the display face carries the personality, body text just needs to be legible.

### 3. Shape language — commit to a radius philosophy
Sharp/flat (technical, serious, instrument-like) and soft/rounded (friendly, approachable,
personality-forward) are opposite statements. Pick one and apply it *everywhere* — buttons,
inputs, cards, badges, the toggle, the icon buttons. A rounded-pill CTA next to a sharp-cornered
card reads as unfinished, not eclectic.

### 4. Depth — real or none, never fake
Either commit to flat (no shadows, ink-on-paper) or commit to real soft depth (offset + blur,
not a flat colored halo). A shadow with zero offset is decoration, not depth. Neobrutalist hard
offset shadows (`4px 4px 0`) only belong in an actual neobrutalist world — don't reach for them
as a generic "give it depth" move.

### 5. Motion — one authored moment, not a library of effects
Pick the signature interaction the world implies (a line drawing itself in for a technical
world, a sticker popping in with overshoot for a playful world, a count-up for a data reveal)
and use it deliberately. Don't apply the same fade-up to every single element — vary it, and
let some things enter with more character than others.

### 6. Personality / voice — copy is part of the design
Match copy *register* to the visual world: lowercase and casual for a friendly/Gen-Z world,
precise and technical for an instrument world. Don't rewrite established factual copy without
checking — but UI chrome (button labels, section headings, placeholder text) is fair game to
restyle to match voice.

### 7. The AI-generated-design tells — refuse these by default
These read as generic/unoriginal specifically *because* they're what happens automatically. A
brief can earn most of them back with a real reason; a couple are flat bans:
- **Gradient text** — emphasis comes from weight/size/color, not `bg-clip-text`.
- **A kicker/eyebrow label above a heading** — flat ban, no brief earns it back. The heading
  carries its own weight.
- **Glass/blur as decoration** rather than a specific, deliberate effect.
- **Same-size cards of icon + heading + text** as the default page structure. Cards are the
  lazy container.
- **A colored `border-left` accent** on cards/callouts.
- **Sparklines, progress rings, soft-shadowed rounded rectangles** standing in for real content.
- **Monospace as a costume for "technical"** rather than for actual code/data/measurement.
- **The platform system font** (or the model's own favorite defaults) as an own-world page's
  display voice.
- Purple/violet as a default "AI palette" reach — not a permanent ban like the others, but
  worth noticing if it's showing up without a reason.

### 8. The craft floor — mechanical, but easy to skip
- Contrast: body/placeholder text ≥4.5:1, large text ≥3:1. Tint secondary text from the
  world's hue, never plain gray.
- Spacing: more space above a heading than below it. Read the actual computed values, don't
  eyeball it.
- Type: body measure 65-75ch, obvious scale/weight steps, run real copy at every breakpoint.
- States: hover, disabled, loading, error, empty — all four, not just the happy path.
- Browser surfaces: selection color, caret, scrollbars, focus rings all inherit the palette
  instead of shipping browser defaults. Cheap signal a page was actually designed.

## The process, start to finish

1. **Ground it.** Get or find a reference. Look at it directly if one exists.
2. **Name the thesis.** One sentence: what idea does this surface own, and what's the
   category-default arrangement it's refusing?
3. **Pick the seven-checklist answers above, deliberately, before writing code.** Write them
   down (even just a comment block at the top of the root layout file) so the build has
   something to stay honest to.
4. **Build fully committed.** A stock component inside a committed world is a lapse — rebuild
   nav, buttons, inputs in the world's own vocabulary rather than leaving shadcn defaults
   untouched.
5. **Inspect once, batched.** Screenshot desktop + mobile, light + dark, together. Fix
   everything the pass shows. One more confirmation round, then stop — open-ended self-QA
   burns time re-finding the same three issues.
6. **Run a mechanical detector if you have one** (this repo uses `impeccable`'s `detect.mjs`)
   before calling it done — it catches things like gradient-text that are easy to miss by eye.
7. **Write down what you built**, not what you planned — a system doc (like `web/DESIGN.md` in
   this repo) written *after* the build, from the built world, so it's accurate and so a future
   pass on the same app doesn't accidentally re-litigate a settled decision (color palette,
   "no purple," radius philosophy) as if it were still open.

## Applying this to a new app

Start over at step 1 with a *new* reference or a fresh thesis — don't drag buildscore's actual
tokens (Fredoka, cream/dusk-brown, the sticker motif) into an unrelated app just because they
worked here. What transfers is the *checklist and process*, not the specific palette. The one
thing that should transfer literally: if the person you're building for names a reference,
stop generating your own ideas and go look at what they pointed at.
