CREATE TABLE "promo_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"gender" text NOT NULL,
	"booking_date" text NOT NULL,
	"booking_time" text NOT NULL,
	"status" text DEFAULT 'LOCKED' NOT NULL,
	"locked_until" text,
	"ticket_code" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_branch_prices" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"price" integer NOT NULL,
	"commission" integer
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_mutations" (
	"id" text PRIMARY KEY NOT NULL,
	"mutation_number" text NOT NULL,
	"therapist_id" text NOT NULL,
	"from_branch_id" text,
	"to_branch_id" text NOT NULL,
	"effective_date" text NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"requested_by" text NOT NULL,
	"requested_by_name" text NOT NULL,
	"approved_by" text,
	"approved_by_name" text,
	"approved_at" text,
	"executed_at" text,
	"rejected_reason" text,
	"reversed_by" text,
	"reversed_by_name" text,
	"reversed_at" text,
	"reversed_reason" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "therapist_mutations_mutation_number_unique" UNIQUE("mutation_number")
);
--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "brand" text DEFAULT 'NAVARA' NOT NULL;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD COLUMN "check_in_time" text;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD COLUMN "check_out_time" text;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD COLUMN "actual_check_out_time" text;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD COLUMN "therapist_status_snapshot" text;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "service_ids" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "global_commission" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "branch_id" text;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "availability_status" text DEFAULT 'AVAILABLE' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_branch_prices" ADD CONSTRAINT "service_branch_prices_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_branch_prices" ADD CONSTRAINT "service_branch_prices_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_mutations" ADD CONSTRAINT "therapist_mutations_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_mutations" ADD CONSTRAINT "therapist_mutations_from_branch_id_branches_id_fk" FOREIGN KEY ("from_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_mutations" ADD CONSTRAINT "therapist_mutations_to_branch_id_branches_id_fk" FOREIGN KEY ("to_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "promo_date_idx" ON "promo_bookings" USING btree ("booking_date");--> statement-breakpoint
CREATE INDEX "promo_phone_idx" ON "promo_bookings" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "promo_ticket_idx" ON "promo_bookings" USING btree ("ticket_code");--> statement-breakpoint
CREATE INDEX "sbp_service_idx" ON "service_branch_prices" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "sbp_branch_idx" ON "service_branch_prices" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "sbp_unique_idx" ON "service_branch_prices" USING btree ("service_id","branch_id");--> statement-breakpoint
CREATE INDEX "mutation_therapist_idx" ON "therapist_mutations" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "mutation_status_idx" ON "therapist_mutations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mutation_date_idx" ON "therapist_mutations" USING btree ("effective_date");--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_branch_idx" ON "services" USING btree ("branch_id");