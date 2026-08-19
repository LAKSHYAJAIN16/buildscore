// Developer-type quiz -- reuses the "Builder Archetypes" taxonomy from
// docs/VISION.md rather than inventing a disconnected one, so this ties
// coherently into the product's own vocabulary (and can plausibly connect
// to a real computed archetype off actual Buildscore data later, per
// algorithm.md's Builder Archetypes section -- that one derives from a
// real GitHub scan, this one is a self-report quiz; different mechanism,
// same six types on purpose).
//
// Purely client-side, no backend: answers and the tallied result live in
// component state only, nothing is submitted or stored anywhere.

export type ArchetypeKey =
  | "sprinter"
  | "craftsman"
  | "hacker"
  | "operator"
  | "researcher"
  | "machine";

export interface Archetype {
  name: string;
  tagline: string;
  description: string;
}

export const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  sprinter: {
    name: "the sprinter",
    tagline: "ships fast, forgets it existed by Tuesday",
    description:
      "You ship fast and don't look back. Momentum is the whole game — ten scrappy live " +
      "things beat one polished thing still \"almost done.\" The tradeoff: a lot of what you " +
      "start never gets finished, and honestly, that's kind of the point.",
  },
  craftsman: {
    name: "the craftsman",
    tagline: "tests, docs, and a README that isn't a lie",
    description:
      "You'd rather ship one thing that actually works than five that sort of do. Tests, " +
      "docs, a real README — the unglamorous stuff other people skip. Slower to ship, but " +
      "what you ship tends to still be alive a year later.",
  },
  hacker: {
    name: "the hacker",
    tagline: "built with a stack nobody would recommend",
    description:
      "You build the thing nobody asked for, using the stack nobody would recommend, " +
      "because it's more interesting that way. Technical ambition is the whole point — " +
      "\"useful\" is a nice bonus, not the goal.",
  },
  operator: {
    name: "the operator",
    tagline: "shipping is step one, not the finish line",
    description:
      "Shipping is step one. The real work is everything after: the fixes, the iterations, " +
      "the version that actually listens to what users asked for. Your best projects aren't " +
      "the newest ones — they're the ones you never stopped improving.",
  },
  researcher: {
    name: "the researcher",
    tagline: "three weeks on the architecture, no regrets",
    description:
      "You'd rather spend three weeks getting the architecture right than three days " +
      "shipping something you'll regret. Depth over speed, every time. Sometimes that means " +
      "the thing never ships. You're at peace with that.",
  },
  machine: {
    name: "the machine",
    tagline: "day 412 of shipping something every day",
    description:
      "Consistent, fast, and somehow never burnt out. You ship on a schedule most people " +
      "can't sustain for a week, let alone a year. If AI tools help you go faster, you use " +
      "them without a second thought — leverage is leverage.",
  },
};

export interface QuizOption {
  label: string;
  archetype: ArchetypeKey;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

export const QUESTIONS: QuizQuestion[] = [
  {
    id: "idea-at-night",
    prompt: "it's 11pm and an idea just hit. what do you actually do?",
    options: [
      { label: "start coding right now, chase the momentum", archetype: "sprinter" },
      { label: "sketch it out, sleep on it, start clean tomorrow", archetype: "craftsman" },
      { label: "open six tabs for the weirdest possible stack to build it with", archetype: "hacker" },
      { label: "ask an AI to scaffold the boring parts, think through the architecture", archetype: "machine" },
    ],
  },
  {
    id: "prod-broke",
    prompt: "a project you shipped 6 months ago just broke in production. reaction?",
    options: [
      { label: "lol, that one's basically a museum piece now", archetype: "sprinter" },
      { label: "already patched and redeployed before your coffee's done", archetype: "operator" },
      { label: "interesting — new problem to dig into", archetype: "researcher" },
      { label: "your test suite caught it before any user did", archetype: "craftsman" },
    ],
  },
  {
    id: "next-project",
    prompt: "how do you actually pick your next project?",
    options: [
      { label: "whatever's fastest to get in front of real people", archetype: "sprinter" },
      { label: "whatever's the hardest problem you haven't solved yet", archetype: "researcher" },
      { label: "whatever fixes something annoying about your own setup", archetype: "hacker" },
      { label: "whatever your last project's users are already begging for", archetype: "operator" },
    ],
  },
  {
    id: "github-honestly",
    prompt: "your GitHub profile, honestly?",
    options: [
      { label: "a graveyard of repos with 3 commits and huge ambition", archetype: "sprinter" },
      { label: "a small number of repos, all suspiciously well-maintained", archetype: "craftsman" },
      { label: "deeply unhinged side projects nobody asked for", archetype: "hacker" },
      { label: "a commit graph so consistent it looks fake", archetype: "machine" },
    ],
  },
  {
    id: "ai-tools",
    prompt: "your actual relationship with AI coding tools?",
    options: [
      { label: "copilot for the boring parts, I still design everything", archetype: "craftsman" },
      { label: "I let it rip, review fast, ship faster", archetype: "machine" },
      { label: "I use it to poke at ideas I'd never normally try", archetype: "hacker" },
      { label: "I mostly do it myself, that's the fun part", archetype: "researcher" },
    ],
  },
  {
    id: "feature-request",
    prompt: "a real feature request comes in from an actual user. what happens?",
    options: [
      { label: "it goes straight into next week's release", archetype: "operator" },
      { label: "it goes on a list you'll get to eventually, probably", archetype: "sprinter" },
      { label: "you rebuild half the architecture to do it properly", archetype: "researcher" },
      { label: "it gets scoped, tested, and shipped without drama", archetype: "craftsman" },
    ],
  },
  {
    id: "done-means",
    prompt: "what does \"done\" actually mean to you?",
    options: [
      { label: "it works on my machine and one (1) other person saw it", archetype: "sprinter" },
      { label: "it's deployed, monitored, and someone's using it regularly", archetype: "operator" },
      { label: "it's documented, tested, and I'd show it to a stranger", archetype: "craftsman" },
      { label: "it never really is — there's always a better version to build", archetype: "researcher" },
    ],
  },
  {
    id: "tweet-vibe",
    prompt: "pick the tweet that sounds most like you",
    options: [
      { label: "\"shipped in 3 hours, will probably regret this\"", archetype: "sprinter" },
      { label: "\"rewrote the whole thing again, worth it\"", archetype: "researcher" },
      { label: "\"built a compiler for fun, don't ask why\"", archetype: "hacker" },
      { label: "\"day 412 of shipping something every day\"", archetype: "machine" },
    ],
  },
];
