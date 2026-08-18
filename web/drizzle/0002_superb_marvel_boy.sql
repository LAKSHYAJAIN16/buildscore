CREATE TABLE IF NOT EXISTS "grant_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"project_name" text NOT NULL,
	"pitch" text NOT NULL,
	"email" text NOT NULL,
	"buildscore_at_apply" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
