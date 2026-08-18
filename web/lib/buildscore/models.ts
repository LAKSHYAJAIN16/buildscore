// TypeScript port of src/buildscore/models.py — plain data shapes, no classes.

export interface Release {
  publishedAt: Date;
}

// LLM-generated per-repo analysis -- GitRoll calls their version of this
// ACID (Architecture, Cross-Domain, Innovation, Documentation); ours isn't
// trademarked so no (c). Each sub-score is 1-5. `summary` is a 1-2 sentence
// plain-English description of what the repo does and why it scored the
// way it did -- shown to the user, not just folded into a number. Mirrors
// src/buildscore/models.py's AcidAnalysis exactly.
export interface AcidAnalysis {
  summary: string;
  architecture: number;
  crossDomain: number;
  innovation: number;
  documentation: number;
}

export interface RepoData {
  name: string;
  fullName: string;
  createdAt: Date;
  pushedAt: Date;
  isFork: boolean;
  isArchived: boolean;
  sizeKb: number;
  stargazersCount: number;
  languages: Record<string, number>;
  releases: Release[];
  weeklyCommitActivity: CommitActivityWeek[];
  codeFrequency: number[][];
  rootEntries: string[];
  recentCommitMessages: string[];
  description: string | null;
  acid: AcidAnalysis | null;
}

export interface CommitActivityWeek {
  days: number[];
  total: number;
  week: number;
}

export interface RepoClassification {
  repo: RepoData;
  activeness: number;
  isMeaningful: boolean;
  shipDate: Date | null;
  timeToShipDays: number | null;
}

export interface BuilderStats {
  projectsStarted: number;
  meaningfulProjects: number;
  shippedProjects: number;
  completionRate: number;
  graveyardRate: number;
  medianTimeToShipDays: number | null;
  avgActiveness: number;
  longestStreakDays: number;
  avgReleasesPerShipped: number;
}

export interface BuilderVector {
  velocity: number | null;
  finishing: number | null;
  iteration: number | null;
  consistency: number | null;
  ambition: number | null;
  quality: number | null;
  aiLeverage: number | null;
  efficiency: number | null;
}

export interface BuildscoreResult {
  username: string;
  generatedAt: Date;
  stats: BuilderStats;
  vector: BuilderVector;
  score: number;
  repos: RepoClassification[];
}

// --- Raw GitHub API response shapes we actually read from ---

export interface RawGithubRepo {
  name: string;
  full_name: string;
  created_at: string;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  size: number;
  stargazers_count: number;
  owner: { login: string };
  description: string | null;
}

export interface RawGithubRelease {
  published_at: string | null;
}
