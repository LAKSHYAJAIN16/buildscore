# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: developers running buildscore on their own GitHub handle, out of curiosity or self-improvement — "how good am I at making things exist." Secondary, real but dev-first: recruiters/hiring managers who want to evaluate a candidate's actual shipping ability beyond a resume or a contribution graph.

## Product Purpose

Measures how effectively a developer turns ideas into shipped software, reconstructed from their full GitHub history (commits, releases, code churn) rather than surface activity. Output is a "Builder Vector": seven weighted dimensions (Velocity, Finishing, Iteration, Consistency, Ambition, Quality, Efficiency) rolled into a single 0-100 score plus the breakdown.

## Positioning

Not a green-squares / commit-count tool. Analyzes full repo history — release cadence, whether started projects actually ship, project ambition/size/language mix — to measure *how* someone builds, not how often they commit.

## Operating Context

CLI-first (`pip install`-able, `buildscore score <username> --pretty`), requires a GitHub token (the CLI has its own suspicious-token-usage detection, see `src/buildscore/security.py`). The web app (`web/`) is currently a marketing/funnel landing page only — it collects a username but has no live scoring backend yet; submitting shows a copyable CLI command instead ("Web scoring is coming soon").

## Capabilities and Constraints

- Live web scoring is not built yet — explicitly out of scope for the landing page today beyond the "coming soon" messaging already in place.
- The sample "octocat" Builder Vector card on the landing page is a hardcoded illustrative example, not live data.
- Scoring heuristics/thresholds live in `src/buildscore/variables.py` (Python), independent of the web app.

## Brand Commitments

Name: "Buildscore". Wordmark: a circular mark (three ascending rounded bars, echoing the Builder Vector's own dimension bars — not a lettermark) + "Buildscore" text. Open source (repo linked in footer: github.com/LAKSHYAJAIN16/buildscore).

## Evidence on Hand

No real testimonials, customer logos, or usage stats exist yet — none should be fabricated. The only real "evidence" is the product mechanism itself (the seven-dimension Builder Vector) and the sample score card, which must stay clearly a sample, not a real user's data.

## Product Principles

- Measure actual building behavior, not vanity metrics (commit count, streaks, stars).
- CLI-first; the web surface today is a funnel toward the CLI, not a replacement for it.
- Free, open source, no signup required — keep friction at zero.
- Early-stage product moving toward a real hosted product (dev-first audience now, recruiters as a live secondary audience), not a permanently-static side-project page.
