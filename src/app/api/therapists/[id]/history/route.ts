import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { therapists, patientVisits, patients, services, therapistCommissions, invoices } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getSession, checkBranchAccess, getActiveBranchFilter } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM format

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Query parameter 'month' (YYYY-MM) diperlukan" }, { status: 400 });
    }

    const [year, m] = month.split("-");
    const filterStartDate = `${year}-${m}-01`;
    const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate();
    const filterEndDate = `${year}-${m}-${String(lastDay).padStart(2, "0")}`;

    // Get therapist info to verify existence and access
    const therapistData = await db.select().from(therapists).where(eq(therapists.id, id)).limit(1);
    
    if (therapistData.length === 0) {
      return NextResponse.json({ error: "Terapis tidak ditemukan" }, { status: 404 });
    }

    const therapist = therapistData[0];

    // Authorization checks
    if (session.role === "THERAPIST") {
      // Allow if the session name matches the therapist name or if they have the same phone
      if (session.name !== therapist.name && session.username !== therapist.phone) {
        return NextResponse.json({ error: "Forbidden: Anda hanya bisa melihat data Anda sendiri" }, { status: 403 });
      }
    } else {
      const isAllowed = await checkBranchAccess(therapist.branchId);
      if (!isAllowed) {
        return NextResponse.json({ error: "Forbidden: Anda tidak memiliki akses ke data cabang ini" }, { status: 403 });
      }
    }

    const branchFilter = await getActiveBranchFilter();
    
    const visitConditions: any[] = [
      gte(patientVisits.visitDate, filterStartDate),
      lte(patientVisits.visitDate, filterEndDate)
    ];

    if (branchFilter) {
      visitConditions.push(eq(patientVisits.branchId, branchFilter));
    }

    const { or } = await import("drizzle-orm");

    // Fetch visits for this therapist in the specified month
    // We fetch visits where the therapist is either the main therapist OR they received a commission
    const visitsRaw = await db
      .select({
        id: patientVisits.id,
        visitDate: patientVisits.visitDate,
        visitTime: patientVisits.visitTime,
        status: patientVisits.status,
        patientName: patients.name,
        serviceName: services.name,
        servicePrice: services.price,
        patientVisitTherapistId: patientVisits.therapistId,
        commissionAmount: therapistCommissions.amount,
        commissionStatus: therapistCommissions.status,
        commissionTherapistId: therapistCommissions.therapistId,
        invoiceItems: invoices.items,
        invoiceTotal: invoices.grandTotal,
      })
      .from(patientVisits)
      .leftJoin(patients, eq(patientVisits.patientId, patients.id))
      .leftJoin(services, eq(patientVisits.serviceId, services.id))
      .leftJoin(therapistCommissions, eq(patientVisits.id, therapistCommissions.visitId))
      .leftJoin(invoices, eq(patientVisits.id, invoices.visitId))
      .where(
        and(
          ...visitConditions,
          or(
            eq(patientVisits.therapistId, id),
            eq(therapistCommissions.therapistId, id)
          )
        )
      );

    // Group by visitId to avoid duplicates from multiple commissions per visit
    const visitsMap = new Map<string, any>();

    for (const row of visitsRaw) {
      // Only include visits where this therapist was either the main therapist OR received a commission
      if (row.patientVisitTherapistId !== id && row.commissionTherapistId !== id) {
        continue;
      }

      if (!visitsMap.has(row.id)) {
        let finalServiceName = row.serviceName;
        let finalServicePrice = row.servicePrice;

        if (row.invoiceItems) {
          try {
            const items = JSON.parse(row.invoiceItems);
            if (Array.isArray(items) && items.length > 0) {
              finalServiceName = items.map((i: any) => {
                if (i.qty && i.qty > 1) return `${i.name} (x${i.qty})`;
                return i.name;
              }).join(" + ");
              finalServicePrice = row.invoiceTotal || items.reduce((sum: number, i: any) => sum + (i.subtotal || (i.price * (i.qty || 1))), 0);
            }
          } catch (e) {}
        }

        visitsMap.set(row.id, {
          id: row.id,
          visitDate: row.visitDate,
          visitTime: row.visitTime,
          status: row.status,
          patientName: row.patientName,
          serviceName: finalServiceName,
          servicePrice: finalServicePrice,
          commissionAmount: 0,
          commissionStatus: null,
        });
      }

      const visit = visitsMap.get(row.id);

      // Add commission ONLY if it belongs to THIS therapist
      if (row.commissionTherapistId === id) {
        visit.commissionAmount += (row.commissionAmount || 0);
        if (row.commissionStatus) {
          visit.commissionStatus = row.commissionStatus;
        }
      }
    }

    const visits = Array.from(visitsMap.values());

    // Sort descending by date and time
    visits.sort((a, b) => {
      const dateA = new Date(`${a.visitDate}T${a.visitTime.replace('.', ':')}`);
      const dateB = new Date(`${b.visitDate}T${b.visitTime.replace('.', ':')}`);
      return dateB.getTime() - dateA.getTime();
    });

    const totalTreatments = visits.filter(v => v.status === "completed").length;
    const totalCommissions = visits.reduce((sum, v) => sum + (v.commissionAmount || 0), 0);

    return NextResponse.json({
      therapist: {
        id: therapist.id,
        name: therapist.name,
        specialization: therapist.specialization,
      },
      period: {
        month,
        startDate: filterStartDate,
        endDate: filterEndDate,
      },
      summary: {
        totalTreatments,
        totalCommissions,
      },
      data: visits,
    });
  } catch (error) {
    console.error("GET /api/therapists/[id]/history error:", error);
    return NextResponse.json({ error: "Gagal mengambil riwayat pasien terapis" }, { status: 500 });
  }
}
