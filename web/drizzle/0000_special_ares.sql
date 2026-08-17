CREATE TABLE IF NOT EXISTS "github_token_usage_state" (
	"token_fingerprint" text PRIMARY KEY NOT NULL,
	"remaining" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "rate_limit_buckets_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "repos_cache" (
	"full_name" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"pushed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"is_fork" boolean NOT NULL,
	"is_archived" boolean NOT NULL,
	"size_kb" integer NOT NULL,
	"stargazers_count" integer NOT NULL,
	"languages" jsonb NOT NULL,
	"releases" jsonb NOT NULL,
	"weekly_commit_activity" jsonb NOT NULL,
	"code_frequency" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_scores" (
	"username" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"result" jsonb,
	"error" text,
	"repo_listing_snapshot" jsonb,
	"progress" jsonb,
	"requested_at" timestamp with time zone NOT NULL,
	"generated_at" timestamp with time zone,
	"updated_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone
);
