CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "accounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'BRANCH_ADMIN' NOT NULL,
	"permissions" text,
	"branch_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"therapist_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"date" text NOT NULL,
	"clock_in" text,
	"clock_out" text,
	"status" text DEFAULT 'PRESENT' NOT NULL,
	"notes" text,
	"photo_url" text
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"whatsapp_number" text NOT NULL,
	"operating_hours" text DEFAULT '09:00 - 21:00 WIB' NOT NULL,
	"operating_hours_weekend" text DEFAULT '09:00 - 21:00 WIB' NOT NULL,
	"map_url" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"reference_id" text,
	"branch_id" text,
	"payment_method" text DEFAULT 'CASH' NOT NULL,
	"attachment_url" text,
	"date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"unit" text NOT NULL,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"min_stock_alert" integer DEFAULT 5 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"notes" text,
	"branch_id" text,
	"date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"visit_id" text,
	"patient_id" text NOT NULL,
	"patient_name" text NOT NULL,
	"patient_phone" text NOT NULL,
	"therapist_id" text,
	"therapist_name" text,
	"branch_id" text NOT NULL,
	"branch_name" text NOT NULL,
	"branch_address" text,
	"branch_phone" text,
	"items" text NOT NULL,
	"subtotal" integer NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"tax" integer DEFAULT 0 NOT NULL,
	"grand_total" integer NOT NULL,
	"payment_method" text DEFAULT 'CASH' NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"change_amount" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" text NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"description" text NOT NULL,
	"reference_id" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"account_id" text NOT NULL,
	"debit" integer DEFAULT 0 NOT NULL,
	"credit" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_targets" (
	"id" text PRIMARY KEY NOT NULL,
	"month" text NOT NULL,
	"branch_id" text NOT NULL,
	"target_income" integer DEFAULT 0 NOT NULL,
	"target_visits" integer DEFAULT 0 NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_visits" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"service_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"therapist_id" text,
	"visit_date" text NOT NULL,
	"visit_time" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"payment_status" text DEFAULT 'UNPAID' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text,
	"gender" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"branch_id" text NOT NULL,
	"service_id" text NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"category" text DEFAULT 'Paket Treatment' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"description" text NOT NULL,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"whatsapp_number" text NOT NULL,
	"facebook_url" text,
	"instagram_url" text,
	"youtube_url" text,
	"hero_badge_text" text DEFAULT 'TERPERCAYA & PROFESIONAL' NOT NULL,
	"hero_title" text DEFAULT 'Solusi Teman Sehatku' NOT NULL,
	"hero_description" text DEFAULT 'Menghadirkan layanan pengobatan sunnah berkualitas tinggi dengan standar medis modern. Temukan ketenangan dan kesembuhan alami di tangan terapis ahli kami.' NOT NULL,
	"operating_hours" text DEFAULT '09:00 - 21:00 WIB' NOT NULL,
	"operating_hours_weekend" text DEFAULT '09:00 - 21:00 WIB' NOT NULL,
	"map_url" text,
	"about_page_content" json,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"phone" text NOT NULL,
	"base_salary" integer DEFAULT 0 NOT NULL,
	"daily_allowance" integer DEFAULT 0 NOT NULL,
	"branch_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"joined_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_payroll_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"month" text NOT NULL,
	"attendance_present" integer DEFAULT 0 NOT NULL,
	"attendance_late" integer DEFAULT 0 NOT NULL,
	"attendance_absent" integer DEFAULT 0 NOT NULL,
	"base_salary" integer DEFAULT 0 NOT NULL,
	"allowances" integer DEFAULT 0 NOT NULL,
	"bonuses" integer DEFAULT 0 NOT NULL,
	"deductions" integer DEFAULT 0 NOT NULL,
	"take_home_pay" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_commissions" (
	"id" text PRIMARY KEY NOT NULL,
	"therapist_id" text NOT NULL,
	"visit_id" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"paid_at" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_monthly_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"therapist_id" text NOT NULL,
	"month" text NOT NULL,
	"total_treatments" integer DEFAULT 0 NOT NULL,
	"attendance_present" integer DEFAULT 0 NOT NULL,
	"attendance_late" integer DEFAULT 0 NOT NULL,
	"attendance_absent" integer DEFAULT 0 NOT NULL,
	"attendance_permit" integer DEFAULT 0 NOT NULL,
	"base_salary" integer DEFAULT 0 NOT NULL,
	"commissions" integer DEFAULT 0 NOT NULL,
	"allowances" integer DEFAULT 0 NOT NULL,
	"bonuses" integer DEFAULT 0 NOT NULL,
	"deductions" integer DEFAULT 0 NOT NULL,
	"take_home_pay" integer DEFAULT 0 NOT NULL,
	"notes_strengths" text,
	"notes_improvements" text,
	"notes_targets" text,
	"rating" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_service_commissions" (
	"id" text PRIMARY KEY NOT NULL,
	"therapist_id" text NOT NULL,
	"service_id" text NOT NULL,
	"commission_amount" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"specialization" text NOT NULL,
	"phone" text NOT NULL,
	"gender" text NOT NULL,
	"base_salary" integer DEFAULT 0 NOT NULL,
	"commission_rate" integer DEFAULT 0 NOT NULL,
	"branch_id" text,
	"photo_url" text,
	"birth_date" text,
	"pin_code" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"joined_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_visit_id_patient_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."patient_visits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_entry_id_journal_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_targets" ADD CONSTRAINT "monthly_targets_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD CONSTRAINT "patient_visits_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_payroll_reports" ADD CONSTRAINT "staff_payroll_reports_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_commissions" ADD CONSTRAINT "therapist_commissions_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_commissions" ADD CONSTRAINT "therapist_commissions_visit_id_patient_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."patient_visits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_monthly_reports" ADD CONSTRAINT "therapist_monthly_reports_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_service_commissions" ADD CONSTRAINT "therapist_service_commissions_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_service_commissions" ADD CONSTRAINT "therapist_service_commissions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapists" ADD CONSTRAINT "therapists_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;