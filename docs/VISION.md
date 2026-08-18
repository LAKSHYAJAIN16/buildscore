# Buildscore

> **How good are you at making things exist?**

## Overview

Buildscore is an analytics platform that measures a developer's ability to **turn ideas into shipped software**.

Traditional developer metrics measure code: commits, lines written, contribution graphs, stars, pull requests, or code quality.

Buildscore measures **execution**.

It analyzes a developer's GitHub history to reconstruct how they actually build:

- How quickly do they go from starting → shipping?
- How often do they finish what they start?
- Do they continue improving things after launch?
- How ambitious are their projects?
- How efficiently do they use AI?
- How much meaningful functionality do they produce?
- How often do projects end up abandoned?

The result is a **Buildscore from 0–100** representing someone's demonstrated ability to ship software.

---

# Core Thesis

Developer productivity is increasingly poorly represented by code output.

A developer using coding agents might manually write 500 lines while producing the equivalent of 10,000 lines of useful software.

The important question is no longer:

> How much code did you write?

It is:

> **How effectively can you make working software exist?**

Buildscore attempts to quantify that ability.

---

# Example

## Buildscore: 87/100

**Top 6% of builders**

| Dimension | Score |
| --- | --- |
| Shipping Velocity | 94 |
| Completion | 88 |
| Consistency | 91 |
| Iteration | 83 |
| Technical Ambition | 90 |
| Code Quality | 76 |
| AI Leverage | 93 |

### Builder Stats

**Median Idea → MVP**

4.8 days

**Projects Shipped**

17

**Completion Rate**

81%

**Graveyard Rate**

12%

**Median Project Lifespan**

7.3 months

**Post-Launch Iterations**

14.2/project

**Longest Building Streak**

63 days

**Fastest Ship**

11 hours

---

# Buildscore Model

Represent each developer with a **Builder Vector**:

```
B = (V, F, I, C, A, Q, L, E)
```

Where:

- V = shipping velocity
- F = finishing ability
- I = iteration
- C = consistency
- A = technical ambition
- Q = quality
- L = AI leverage
- E = efficiency

A simplified initial model could be:

```
S = 0.20V + 0.20F + 0.15I + 0.10C + 0.15A + 0.10Q + 0.10E
```

The raw value is percentile-normalized against comparable developers to produce:

```
Buildscore ∈ [0, 100]
```

The weights should eventually be learned from real-world outcomes rather than manually selected.

---

# Key Metrics

## 1. Time-to-Ship

Estimate the time between meaningful project initiation and the first usable version.

Signals could include:

- repository creation
- first substantial commit
- first tagged release
- deployment configuration
- package publication
- production URL
- release notes

This creates metrics such as:

**Median Time-to-Ship: 4.8 days**

---

## 2. Completion Rate

Determine how often developers actually finish projects.

```
CompletionRate = ShippedProjects / MeaningfulProjectsStarted
```

A repository containing three commits and disappearing forever should count differently from an actively maintained product.

---

## 3. Graveyard Rate

Measure abandoned projects.

```
GraveyardRate = AbandonedProjects / ProjectsStarted
```

Buildscore could classify repositories as:

`Experiment → Active → MVP → Shipped → Maintained → Dormant → Abandoned`

This produces a developer's **project lifecycle profile**.

---

## 4. Iteration Velocity

Shipping once isn't enough.

Buildscore measures how quickly developers improve software after launch.

Possible signals:

- releases
- feature additions
- bug fixes
- schema changes
- dependency upgrades
- UI changes
- issue resolution

A developer who ships and continuously improves products should outperform someone who constantly creates new repositories.

---

## 5. Feature Velocity

Raw LOC is a terrible productivity metric.

Instead, Buildscore attempts to detect **semantic units of functionality**.

For example:

```
Commit 1
+ Authentication

Commit 2
+ Stripe payments

Commit 3
+ Dashboard

Commit 4
+ Team invitations
```

Using AST analysis and LLM-assisted diff classification, Buildscore estimates meaningful functionality introduced over time.

This produces:

```
FeatureVelocity = MeaningfulFeatures / DevelopmentTime
```

---

# AI Leverage

This becomes one of Buildscore's defining features.

AI-generated code is not treated as cheating.

It is treated as **leverage**.

The question becomes:

> How effectively does this developer convert AI assistance into reliable shipped software?

A conceptual metric:

```
BuilderEfficiency = MeaningfulShippedFunctionality / (HumanTime + λ·AICompute)
```

Buildscore could analyze:

- code-generation patterns
- commit structure
- agent metadata where available
- unusually large code changes
- AI configuration files
- coding-agent workflows
- subsequent human modification
- generated-code survival

Eventually a profile might show:

```
AI Leverage       93
AI-assisted       ~71%
Human-authored    ~29%

AI code retained after 30 days: 84%
```

The last metric is particularly interesting.

Generating 20,000 lines with an agent means little if half of it gets rewritten the following week.

---

# Technical Ambition

Buildscore should distinguish:

> "I made a static portfolio."

from:

> "I implemented a distributed database."

Analyze repository architecture for signals such as:

- distributed systems
- networking
- databases
- concurrency
- ML systems
- compilers
- infrastructure
- cryptography
- formal verification
- complex frontend state
- real-time systems
- external integrations

The goal isn't to punish simple products.

It is to measure the **technical difficulty of what someone attempts**.

---

# Semantic Git Analysis

This is the technical heart of Buildscore.

Instead of treating Git as a collection of commits, reconstruct the **history of the software itself**.

Pipeline:

```
GitHub Repository
        ↓
Commit History
        ↓
Diff Extraction
        ↓
AST Parsing
        ↓
Semantic Change Detection
        ↓
Feature Classification
        ↓
Project Lifecycle Reconstruction
        ↓
Builder Vector
        ↓
Buildscore
```

For each significant commit, classify changes such as:

```
FEATURE
BUG FIX
REFACTOR
TEST
DOCUMENTATION
INFRASTRUCTURE
DEPENDENCY
GENERATED CODE
FORMATTING
EXPERIMENT
REVERT
```

This makes Buildscore dramatically harder to game than contribution-count metrics.

---

# Anti-Gaming

The scoring system should explicitly resist optimization through meaningless activity.

Downweight:

- commit spam
- README-only repositories
- generated repositories
- forks
- dependency updates
- formatting changes
- vendored code
- mass AI-generated boilerplate
- meaningless LOC increases

Analyze **semantic change**, not activity volume.

One hundred `update README` commits should contribute almost nothing.

One commit implementing a functioning database engine might contribute enormously.

---

# Builder Archetypes

Buildscore could classify developers based on their Builder Vector.

### The Sprinter

Ships extremely quickly but frequently abandons projects.

### The Craftsman

Ships slowly but produces highly maintained software.

### The Hacker

Extremely fast experimentation and high technical ambition.

### The Operator

Exceptional iteration and maintenance after launch.

### The Researcher

High technical complexity with longer development cycles.

### The Machine

Exceptional velocity, consistency, completion, and AI leverage.

These make profiles significantly more shareable.

---

# Build Graph

Instead of only showing a contribution graph, reconstruct someone's **building history**.

```
2024 ─────────────── 2025 ─────────────── 2026

28bot
██████████████████████████████████████

Project A
       ████████ ✓ SHIPPED

Project B
              ███ ✕

Project C
                    █████████████ ✓

Project D
                               ███████ →
```

This immediately communicates how someone works.

---

# Build Wrapped

Once per year, generate a Spotify-Wrapped-style report.

Example:

> You spent 2026 building.

```
31 projects started
19 projects shipped
412 meaningful features
1,842 commits

Median time-to-ship:
3.7 days

Fastest project:
8 hours

Longest project:
14 months

Your Buildscore increased:
74 → 91

You shipped faster than
96% of builders.
```

This could become a major organic distribution mechanism.

---

# Social Layer

Every developer receives a public profile:

```
buildscore.dev/lakshya
```

Profiles contain:

- Buildscore
- percentile
- Builder Vector
- archetype
- shipping statistics
- active projects
- build timeline
- personal records

Users can generate badges:

```
BUILDSCORE
91 / 100
TOP 4%
```

for GitHub READMEs, portfolios, résumés, and personal websites.

---

# Leaderboards

Possible leaderboards:

- Global
- Students
- Open-source developers
- AI builders
- Hackathon builders
- University
- Organization
- Language
- Country
- Age of account

More interesting leaderboards could include:

**Fastest Shippers**

**Most Improved**

**Most Consistent**

**Highest AI Leverage**

**Lowest Graveyard Rate**

---

# MVP

The first version does not need perfect semantic analysis.

### Phase 1 — GitHub ingestion

Use the GitHub API to collect:

- repositories
- commits
- branches
- releases
- pull requests
- issues
- languages
- stars/forks
- repository age

### Phase 2 — Repository classification

Determine:

- serious project
- experiment
- fork
- tutorial
- abandoned
- shipped
- maintained

### Phase 3 — Lifecycle reconstruction

Estimate:

```
Created
↓
Development
↓
MVP
↓
Release
↓
Iteration
↓
Maintenance / Abandonment
```

### Phase 4 — Scoring

Calculate:

- Shipping Velocity
- Completion
- Consistency
- Iteration
- Technical Ambition
- Quality

Generate the initial Buildscore.

### Phase 5 — Public profiles

Create beautiful shareable developer profiles.

---

# Later Technical Expansion

The much more ambitious version becomes a learned model.

Create a dataset of developer histories:

```
X_i = GitHistory_i
```

and downstream outcomes:

```
Y_i = { users, stars, downloads, funding, contributors, longevity, employment }
```

Train a model:

```
f(X_i) → Y_i
```

The resulting latent representation could identify characteristics of developers whose projects actually succeed.

Buildscore would then become less of an arbitrary scoring formula and more of a **predictive model of builder execution**.

---

# Research Question

This also creates a legitimate research direction:

> **Can software execution ability be inferred from the temporal and semantic structure of a developer's repository history?**

Secondary questions:

- Does shipping velocity predict project success?
- Does repository abandonment predict future completion behavior?
- Does AI-assisted development increase feature velocity?
- Is AI-generated code associated with increased future churn?
- Which Git-history characteristics predict successful projects?
- Can developer execution style be represented as a stable latent vector?

---

# Long-Term Vision

GitHub tells you:

> **What code has this person written?**

LinkedIn tells you:

> **Where has this person worked?**

LeetCode tells you:

> **How well can this person solve algorithm problems?**

Buildscore tells you:

> **Can this person actually ship?**

The eventual goal is to make **Buildscore a standardized reputation layer for builders**.

Not a measure of how much someone codes.

Not a measure of how many green squares they have.

Not even necessarily a measure of how good a programmer they are.

A measure of something increasingly more valuable:

> **Their demonstrated ability to make software exist.**

---

## Implementation status (as of this snapshot)

What's actually built today, for context against the ambition above — see
`README.md` and `web/DEPLOY.md` for current details, this section won't be
kept in sync going forward:

- **Phase 1 (ingestion)**: done, GitHub REST API only.
- **Phase 2/3 (classification/lifecycle)**: implemented differently than
  described above — a continuous 0-100 `activeness` score
  (`src/buildscore/lifecycle.py`) replaced the categorical
  `Experiment → ... → Abandoned` staging; that was a deliberate later
  decision, not an oversight.
- **Phase 4 (scoring)**: `velocity`, `finishing`, `iteration`, `consistency`,
  `ambition`, `quality`, `ai_leverage` are implemented as v0 heuristics on
  GitHub metadata only — no AST parsing or semantic git analysis yet, that
  entire "Semantic Git Analysis" section is still Phase 2/aspirational.
  `efficiency` is not implemented.
- **Phase 5 (public profiles)**: not built. The current web frontend is a
  marketing landing page with live single-user scoring, not the
  `buildscore.dev/username` public-profile/leaderboard/Build-Wrapped vision
  described above.
- **Anti-Gaming**: partially reflected — exact heuristic thresholds are kept
  out of the public repo (`variables.py`/`variables.ts` are gitignored) for
  the reason this doc gives, but semantic-change-vs-activity-volume
  detection doesn't exist yet (needs the AST/semantic pipeline).
