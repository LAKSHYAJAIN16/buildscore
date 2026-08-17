// TypeScript port of src/buildscore/models.py — plain data shapes, no classes.

export interface Release {
  publishedAt: Date;
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
}

export interface RawGithubRelease {
  published_at: string | null;
}
