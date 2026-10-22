CREATE TYPE "public"."request_status" AS ENUM('new', 'answered', 'done');--> statement-breakpoint
CREATE TYPE "public"."request_topic" AS ENUM('coaching', 'lab_test', 'other');--> statement-breakpoint
CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"topic" "request_topic" NOT NULL,
	"message" text NOT NULL,
	"locale" text NOT NULL,
	"status" "request_status" DEFAULT 'new' NOT NULL,
	"consented_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "requests_status_created_at" ON "requests" USING btree ("status","created_at");