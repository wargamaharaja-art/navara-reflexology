import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerFeedbacks, branches, therapists, invoices, patientVisits } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, inArray, like } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";
import { ensureFeedbackTable } from "@/lib/db/feedback-init";

// GET: List feedbacks with filters
export async function GET(request: Request) {
  try {
    await ensureFeedbackTable();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchFilter = await getActiveBranchFilter();
    const queryBranchId = searchParams.get("branchId");
    const therapistId = searchParams.get("therapistId");
    const status = searchParams.get("status"); // PENDING, SUBMITTED, FLAGGED, or ALL
    const minRating = searchParams.get("minRating");
    const maxRating = searchParams.get("maxRating");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const conditions = [];

    // Branch context
    const effectiveBranch = branchFilter || (queryBranchId && queryBranchId !== "ALL" ? queryBranchId : null);
    if (effectiveBranch) {
      conditions.push(eq(customerFeedbacks.branchId, effectiveBranch));
    }

    // Therapist filter
    if (therapistId && therapistId !== "ALL") {
      conditions.push(eq(customerFeedbacks.therapistId, therapistId));
    }

    // Status filter
    if (status && status !== "ALL") {
      conditions.push(eq(customerFeedbacks.status, status as any));
    }

    // Rating filter
    if (minRating) {
      conditions.push(gte(customerFeedbacks.overallRating, Number(minRating)));
    }
    if (maxRating) {
      conditions.push(lte(customerFeedbacks.overallRating, Number(maxRating)));
    }

    // Date range filter
    if (startDate) {
      conditions.push(gte(customerFeedbacks.createdAt, `${startDate}T00:00:00`));
    }
    if (endDate) {
      conditions.push(lte(customerFeedbacks.createdAt, `${endDate}T23:59:59`));
    }

    // Search query on customerName or phone
    if (search) {
      conditions.push(like(customerFeedbacks.customerName, `%${search}%`));
    }

    const feedbacks = await db
      .select({
        feedback: customerFeedbacks,
        branchName: branches.name,
        branchBrand: branches.brand,
        therapistName: therapists.name,
        invoiceNumber: invoices.invoiceNumber,
      })
      .from(customerFeedbacks)
      .leftJoin(branches, eq(customerFeedbacks.branchId, branches.id))
      .leftJoin(therapists, eq(customerFeedbacks.therapistId, therapists.id))
      .leftJoin(invoices, eq(customerFeedbacks.invoiceId, invoices.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(customerFeedbacks.createdAt));

    const formatted = feedbacks.map((f: any) => ({
      ...f.feedback,
      aspectRatings: f.feedback.aspectRatings ? JSON.parse(f.feedback.aspectRatings) : null,
      branchName: f.branchName,
      branchBrand: f.branchBrand,
      therapistName: f.therapistName,
      invoiceNumber: f.invoiceNumber,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("GET /api/feedback error:", error);
    return NextResponse.json({ error: "Gagal memuat daftar feedback" }, { status: 500 });
  }
}

// PATCH: Update feedback (flag, resolve, notes)
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: "ID feedback wajib diisi" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (status) {
      updatePayload.status = status;
    }

    await db
      .update(customerFeedbacks)
      .set(updatePayload)
      .where(eq(customerFeedbacks.id, id));

    return NextResponse.json({
      success: true,
      message: "Feedback berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("PATCH /api/feedback error:", error);
    return NextResponse.json({ error: "Gagal memperbarui feedback" }, { status: 500 });
  }
}

// DELETE: Delete a feedback record
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "BRANCH_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID feedback wajib diisi" }, { status: 400 });
    }

    await db.delete(customerFeedbacks).where(eq(customerFeedbacks.id, id));

    return NextResponse.json({
      success: true,
      message: "Feedback berhasil dihapus",
    });
  } catch (error: any) {
    console.error("DELETE /api/feedback error:", error);
    return NextResponse.json({ error: "Gagal menghapus feedback" }, { status: 500 });
  }
}
