CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"icon" varchar DEFAULT 'fas fa-trophy',
	"earned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"author_id" varchar NOT NULL,
	"family_id" varchar NOT NULL,
	"context_type" varchar NOT NULL,
	"context_id" varchar,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"family_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"event_date" timestamp NOT NULL,
	"category" varchar DEFAULT 'family',
	"color" varchar DEFAULT '#6366F1',
	"all_day" boolean DEFAULT false,
	"recurring" boolean DEFAULT false,
	"recurring_pattern" varchar,
	"notification_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar NOT NULL,
	"original_name" varchar NOT NULL,
	"mimetype" varchar NOT NULL,
	"size" integer NOT NULL,
	"uploaded_by" varchar NOT NULL,
	"family_id" varchar NOT NULL,
	"context_type" varchar,
	"context_id" varchar,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "house_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"category" varchar NOT NULL,
	"family_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"priority" varchar DEFAULT 'medium',
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"type" varchar NOT NULL,
	"category" varchar,
	"assigned_to" varchar NOT NULL,
	"assigned_by" varchar,
	"family_id" varchar NOT NULL,
	"points" integer DEFAULT 0,
	"due_date" timestamp,
	"completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"priority" varchar DEFAULT 'medium',
	"recurring" boolean DEFAULT false,
	"recurring_pattern" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'child' NOT NULL,
	"family_id" varchar,
	"points" integer DEFAULT 0,
	"streak" integer DEFAULT 0,
	"last_active_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");