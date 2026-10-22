CREATE TYPE "public"."calendar_status" AS ENUM('connected', 'needs_reconnect');--> statement-breakpoint
CREATE TYPE "public"."conversion_status" AS ENUM('pending', 'sent', 'skipped', 'off', 'failed');--> statement-breakpoint
CREATE TABLE "calendar_connections" (
	"coach_id" uuid PRIMARY KEY NOT NULL,
	"account" text NOT NULL,
	"refresh_token" text NOT NULL,
	"access_token" text,
	"access_token_expires_at" timestamp with time zone,
	"calendar_id" text DEFAULT 'primary' NOT NULL,
	"calendar_name" text,
	"status" "calendar_status" DEFAULT 'connected' NOT NULL,
	"busy" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"busy_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"booking_id" uuid PRIMARY KEY NOT NULL,
	"coach_id" uuid NOT NULL,
	"calendar_id" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversions" (
	"event_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"booking_id" uuid,
	"request_id" uuid,
	"marketing_consent" boolean NOT NULL,
	"client" jsonb,
	"status" "conversion_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reported_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversions_booking_id" ON "conversions" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "conversions_request_id" ON "conversions" USING btree ("request_id");