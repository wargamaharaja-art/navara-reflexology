import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerFeedbacks, branches, therapists, patientVisits, services, invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureFeedbackTable } from "@/lib/db/feedback-init";

// GET: Public endpoint to fetch feedback details by token
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await ensureFeedbackTable();
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
    }

    const feedbackList = await db
      .select()
      .from(customerFeedbacks)
      .where(eq(customerFeedbacks.token, token))
      .limit(1);

    if (feedbackList.length === 0) {
      return NextResponse.json({ error: "Link feedback tidak ditemukan atau sudah kadaluarsa" }, { status: 404 });
    }

    const feedback = feedbackList[0];

    // Fetch branch info
    const branchList = await db
      .select({
        id: branches.id,
        name: branches.name,
        brand: branches.brand,
        address: branches.address,
        phone: branches.phone,
        whatsappNumber: branches.whatsappNumber,
      })
      .from(branches)
      .where(eq(branches.id, feedback.branchId))
      .limit(1);

    const branch = branchList[0] || null;

    // Fetch therapist info if attached
    let therapist = null;
    if (feedback.therapistId) {
      const therapistList = await db
        .select({
          id: therapists.id,
          name: therapists.name,
          specialization: therapists.specialization,
          photoUrl: therapists.photoUrl,
        })
        .from(therapists)
        .where(eq(therapists.id, feedback.therapistId))
        .limit(1);
      therapist = therapistList[0] || null;
    }

    // Fetch service/items if attached to invoice or visit
    let serviceNames: string[] = [];
    if (feedback.invoiceId) {
      const invoiceList = await db
        .select({ items: invoices.items })
        .from(invoices)
        .where(eq(invoices.id, feedback.invoiceId))
        .limit(1);
      if (invoiceList.length > 0 && invoiceList[0].items) {
        try {
          const parsed = JSON.parse(invoiceList[0].items);
          if (Array.isArray(parsed)) {
            serviceNames = parsed.map((item: any) => item.name);
          }
        } catch {
          // ignore json parse error
        }
      }
    } else if (feedback.visitId) {
      const visitList = await db
        .select({ serviceName: services.name })
        .from(patientVisits)
        .leftJoin(services, eq(patientVisits.serviceId, services.id))
        .where(eq(patientVisits.id, feedback.visitId))
        .limit(1);
      if (visitList.length > 0 && visitList[0].serviceName) {
        serviceNames.push(visitList[0].serviceName);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: feedback.id,
        token: feedback.token,
        status: feedback.status,
        customerName: feedback.customerName,
        customerPhone: feedback.customerPhone,
        isAnonymous: feedback.isAnonymous,
        overallRating: feedback.overallRating,
        therapistRating: feedback.therapistRating,
        facilityRating: feedback.facilityRating,
        serviceRating: feedback.serviceRating,
        valueRating: feedback.valueRating,
        comment: feedback.comment,
        aspectRatings: feedback.aspectRatings ? JSON.parse(feedback.aspectRatings) : null,
        wouldRecommend: feedback.wouldRecommend,
        submittedAt: feedback.submittedAt,
        createdAt: feedback.createdAt,
        branch,
        therapist,
        services: serviceNames,
      },
    });
  } catch (error: any) {
    console.error("GET /api/feedback/[token] error:", error);
    return NextResponse.json({ error: "Gagal memuat form feedback" }, { status: 500 });
  }
}

// POST: Public endpoint to submit feedback from customer
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await ensureFeedbackTable();
    const { token } = await params;
    const body = await request.json();

    const {
      overallRating,
      therapistRating,
      facilityRating,
      serviceRating,
      valueRating,
      comment,
      aspectRatings,
      wouldRecommend,
      customerName,
      customerPhone,
      isAnonymous,
    } = body;

    if (!overallRating || overallRating < 1 || overallRating > 5) {
      return NextResponse.json({ error: "Rating keseluruhan wajib diisi (1-5 bintang)" }, { status: 400 });
    }

    const feedbackList = await db
      .select()
      .from(customerFeedbacks)
      .where(eq(customerFeedbacks.token, token))
      .limit(1);

    if (feedbackList.length === 0) {
      return NextResponse.json({ error: "Link feedback tidak ditemukan" }, { status: 404 });
    }

    const existing = feedbackList[0];
    const now = new Date().toISOString();

    const updatePayload: Record<string, any> = {
      overallRating: Number(overallRating),
      therapistRating: therapistRating ? Number(therapistRating) : null,
      facilityRating: facilityRating ? Number(facilityRating) : null,
      serviceRating: serviceRating ? Number(serviceRating) : null,
      valueRating: valueRating ? Number(valueRating) : null,
      comment: comment ? String(comment).trim() : null,
      aspectRatings: aspectRatings ? JSON.stringify(aspectRatings) : null,
      wouldRecommend: typeof wouldRecommend === "boolean" ? wouldRecommend : null,
      isAnonymous: Boolean(isAnonymous),
      status: "SUBMITTED",
      submittedAt: now,
      updatedAt: now,
    };

    if (customerName !== undefined && !isAnonymous) {
      updatePayload.customerName = customerName ? String(customerName).trim() : existing.customerName;
    }
    if (customerPhone !== undefined && !isAnonymous) {
      updatePayload.customerPhone = customerPhone ? String(customerPhone).trim() : existing.customerPhone;
    }

    await db
      .update(customerFeedbacks)
      .set(updatePayload)
      .where(eq(customerFeedbacks.token, token));

    return NextResponse.json({
      success: true,
      message: "Terima kasih banyak atas feedback Anda!",
    });
  } catch (error: any) {
    console.error("POST /api/feedback/[token] error:", error);
    return NextResponse.json({ error: "Gagal mengirim feedback: " + (error?.message || "") }, { status: 500 });
  }
}
