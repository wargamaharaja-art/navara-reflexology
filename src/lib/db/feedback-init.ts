import { db } from "./index";
import { sql } from "drizzle-orm";

let isTableInitialized = false;

export async function ensureFeedbackTable() {
  if (isTableInitialized) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS customer_feedbacks (
        id text PRIMARY KEY,
        token text NOT NULL UNIQUE,
        visit_id text REFERENCES patient_visits(id) ON DELETE SET NULL,
        invoice_id text REFERENCES invoices(id) ON DELETE SET NULL,
        branch_id text NOT NULL REFERENCES branches(id),
        therapist_id text REFERENCES therapists(id) ON DELETE SET NULL,
        customer_name text,
        customer_phone text,
        overall_rating integer,
        therapist_rating integer,
        facility_rating integer,
        service_rating integer,
        value_rating integer,
        comment text,
        aspect_ratings text,
        would_recommend boolean,
        status text NOT NULL DEFAULT 'PENDING',
        is_anonymous boolean NOT NULL DEFAULT false,
        submitted_at text,
        created_at text NOT NULL,
        updated_at text NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS feedback_token_idx ON customer_feedbacks(token);
      CREATE INDEX IF NOT EXISTS feedback_branch_idx ON customer_feedbacks(branch_id);
      CREATE INDEX IF NOT EXISTS feedback_therapist_idx ON customer_feedbacks(therapist_id);
      CREATE INDEX IF NOT EXISTS feedback_status_idx ON customer_feedbacks(status);
      CREATE INDEX IF NOT EXISTS feedback_created_idx ON customer_feedbacks(created_at);
    `);

    isTableInitialized = true;
  } catch (error) {
    console.error("Failed to auto-init customer_feedbacks table:", error);
  }
}
