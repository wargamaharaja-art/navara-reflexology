import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerFeedbacks, branches, therapists, invoices, patientVisits } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ensureFeedbackTable } from "@/lib/db/feedback-init";
import crypto from "crypto";

// Helper to generate clean URL token (e.g. 10-char hex/alphanumeric)
function generateFeedbackToken(): string {
  return crypto.randomBytes(6).toString("hex"); // 12 characters alphanumeric
}

export async function POST(request: Request) {
  try {
    await ensureFeedbackTable();
    const session = await getSession();
    // Allow authenticated admins/cashiers or internal service calls
    const body = await request.json();

    const {
      branchId,
      therapistId,
      visitId,
      invoiceId,
      customerName,
      customerPhone,
    } = body;

    // Resolve branch ID
    let finalBranchId = branchId;
    if (!finalBranchId && session?.branchId && session.branchId !== "ALL") {
      finalBranchId = session.branchId;
    }

    // If invoiceId provided, extract details if missing
    let finalCustomerName = customerName || null;
    let finalCustomerPhone = customerPhone || null;
    let finalTherapistId = therapistId || null;

    if (invoiceId) {
      const invList = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      if (invList.length > 0) {
        const inv = invList[0];
        if (!finalBranchId) finalBranchId = inv.branchId;
        if (!finalCustomerName) finalCustomerName = inv.patientName;
        if (!finalCustomerPhone) finalCustomerPhone = inv.patientPhone;
        if (!finalTherapistId) finalTherapistId = inv.therapistId;
      }
    } else if (visitId) {
      const vList = await db.select().from(patientVisits).where(eq(patientVisits.id, visitId)).limit(1);
      if (vList.length > 0) {
        const v = vList[0];
        if (!finalBranchId) finalBranchId = v.branchId;
        if (!finalTherapistId) finalTherapistId = v.therapistId;
      }
    }

    if (!finalBranchId) {
      // Default to first branch if not specified
      const bList = await db.select().from(branches).limit(1);
      if (bList.length > 0) {
        finalBranchId = bList[0].id;
      } else {
        return NextResponse.json({ error: "Cabang wajib ditentukan" }, { status: 400 });
      }
    }

    // Check if an existing pending feedback token already exists for this invoice/visit
    if (invoiceId) {
      const existing = await db
        .select()
        .from(customerFeedbacks)
        .where(eq(customerFeedbacks.invoiceId, invoiceId))
        .limit(1);
      if (existing.length > 0) {
        return NextResponse.json({
          success: true,
          token: existing[0].token,
          feedbackId: existing[0].id,
          url: `/feedback/${existing[0].token}`,
          isExisting: true,
        });
      }
    }

    const token = generateFeedbackToken();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(customerFeedbacks).values({
      id,
      token,
      branchId: finalBranchId,
      therapistId: finalTherapistId || null,
      visitId: visitId || null,
      invoiceId: invoiceId || null,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      token,
      feedbackId: id,
      url: `/feedback/${token}`,
    });
  } catch (error: any) {
    console.error("POST /api/feedback/generate error:", error);
    return NextResponse.json({ error: "Gagal membuat link feedback: " + (error?.message || "") }, { status: 500 });
  }
}
