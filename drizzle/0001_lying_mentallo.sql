ALTER TABLE "therapist_monthly_reports" ALTER COLUMN "month" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "split_payments" text;--> statement-breakpoint
ALTER TABLE "patient_visits" ADD COLUMN "blood_pressure" text;--> statement-breakpoint
ALTER TABLE "therapist_monthly_reports" ADD COLUMN "start_date" text;--> statement-breakpoint
ALTER TABLE "therapist_monthly_reports" ADD COLUMN "end_date" text;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "contract_start_date" text;--> statement-breakpoint
ALTER TABLE "therapists" ADD COLUMN "contract_end_date" text;--> statement-breakpoint
CREATE INDEX "attendance_branch_idx" ON "attendance" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "attendance_therapist_idx" ON "attendance" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "attendance_date_idx" ON "attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "finance_branch_idx" ON "finance_transactions" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "finance_date_idx" ON "finance_transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "invoice_branch_idx" ON "invoices" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "invoice_date_idx" ON "invoices" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "invoice_therapist_idx" ON "invoices" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "visit_branch_idx" ON "patient_visits" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "visit_date_idx" ON "patient_visits" USING btree ("visit_date");--> statement-breakpoint
CREATE INDEX "visit_therapist_idx" ON "patient_visits" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "reservation_branch_idx" ON "reservations" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "reservation_date_idx" ON "reservations" USING btree ("date");--> statement-breakpoint
CREATE INDEX "commission_therapist_idx" ON "therapist_commissions" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "commission_visit_idx" ON "therapist_commissions" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "therapist_branch_idx" ON "therapists" USING btree ("branch_id");