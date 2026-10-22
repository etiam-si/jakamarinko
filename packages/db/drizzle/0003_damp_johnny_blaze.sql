CREATE TYPE "public"."conversion_status" AS ENUM('pending', 'sent', 'skipped', 'off', 'failed');--> statement-breakpoint
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
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversions_booking_id" ON "conversions" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "conversions_request_id" ON "conversions" USING btree ("request_id");