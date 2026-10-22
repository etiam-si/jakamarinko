CREATE TYPE "public"."discount_type" AS ENUM('free', 'percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."offer_code_kind" AS ENUM('promo', 'free_test', 'referral', 'credit', 'season_retest', 'gift');--> statement-breakpoint
CREATE TABLE "founding_athletes" (
	"email" text PRIMARY KEY NOT NULL,
	"number" smallint NOT NULL,
	"booking_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "founding_athletes_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "offer_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"kind" "offer_code_kind" NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"services" text[],
	"max_uses" integer,
	"expires_at" timestamp with time zone,
	"email" text,
	"note" text,
	"recipient_name" text,
	"owner_user_id" text,
	"booking_id" uuid,
	"created_by_user_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"stripe_checkout_session_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offer_codes_code_unique" UNIQUE("code"),
	CONSTRAINT "offer_codes_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id"),
	CONSTRAINT "offer_codes_value" CHECK ("offer_codes"."value" >= 0 and ("offer_codes"."discount_type" <> 'percent' or "offer_codes"."value" between 1 and 100))
);
--> statement-breakpoint
CREATE TABLE "offer_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"code_id" uuid,
	"list_cents" integer NOT NULL,
	"saved_cents" integer NOT NULL,
	"paid_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offer_redemptions_booking_id_unique" UNIQUE("booking_id"),
	CONSTRAINT "offer_redemptions_sum" CHECK ("offer_redemptions"."paid_cents" = "offer_redemptions"."list_cents" - "offer_redemptions"."saved_cents")
);
--> statement-breakpoint
CREATE TABLE "offer_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"founding_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "founding_athletes" ADD CONSTRAINT "founding_athletes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_codes" ADD CONSTRAINT "offer_codes_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_codes" ADD CONSTRAINT "offer_codes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_codes" ADD CONSTRAINT "offer_codes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_redemptions" ADD CONSTRAINT "offer_redemptions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_redemptions" ADD CONSTRAINT "offer_redemptions_code_id_offer_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."offer_codes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "offer_codes_one_referral" ON "offer_codes" USING btree ("owner_user_id") WHERE "offer_codes"."kind" = 'referral';--> statement-breakpoint
CREATE UNIQUE INDEX "offer_codes_one_credit" ON "offer_codes" USING btree ("booking_id") WHERE "offer_codes"."kind" = 'credit';--> statement-breakpoint
CREATE INDEX "offer_redemptions_code_id" ON "offer_redemptions" USING btree ("code_id");