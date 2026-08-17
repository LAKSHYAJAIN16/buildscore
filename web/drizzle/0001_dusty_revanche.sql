ALTER TABLE "repos_cache" ADD COLUMN "root_entries" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "repos_cache" ADD COLUMN "recent_commit_messages" jsonb NOT NULL;