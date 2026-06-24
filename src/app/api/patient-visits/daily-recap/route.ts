import { db } from "@/lib/db";
import { patientVisits, patients, services, branches, therapists } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    
    // Default to today in Asia/Jakarta timezone
    const targetDate = dateParam || new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

    const branchFilter = await getActiveBranchFilter();

    // 1. Fetch all active branches to seed the breakdown
    const branchBreakdown: Record<string, any> = {};
    const allBranches = await db.select().from(branches).where(eq(branches.isActive, true));
    allBranches.forEach((b) => {
      if (branchFilter && b.id !== branchFilter) return;
      branchBreakdown[b.id] = {
        branchName: b.name,
        totalVisits: 0,
        totalCompleted: 0,
        totalRevenue: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        L: 0,
        P: 0,
      };
    });

    // 2. Fetch all visits on targetDate
    const visitConditions = [eq(patientVisits.visitDate, targetDate)];
    if (branchFilter) {
      visitConditions.push(eq(patientVisits.branchId, branchFilter));
    }

    const result = await db
      .select({
        visitId: patientVisits.id,
        patientId: patientVisits.patientId,
        patientName: patients.name,
        patientPhone: patients.phone,
        patientGender: patients.gender,
        serviceId: patientVisits.serviceId,
        serviceName: services.name,
        servicePrice: services.price,
        branchId: patientVisits.branchId,
        branchName: branches.name,
        therapistId: patientVisits.therapistId,
        therapistName: therapists.name,
        visitDate: patientVisits.visitDate,
        visitTime: patientVisits.visitTime,
        notes: patientVisits.notes,
        status: patientVisits.status,
        paymentStatus: patientVisits.paymentStatus,
      })
      .from(patientVisits)
      .innerJoin(patients, eq(patientVisits.patientId, patients.id))
      .innerJoin(services, eq(patientVisits.serviceId, services.id))
      .innerJoin(branches, eq(patientVisits.branchId, branches.id))
      .leftJoin(therapists, eq(patientVisits.therapistId, therapists.id))
      .where(and(...visitConditions))
      .orderBy(desc(patientVisits.visitTime));

    // 3. Aggregate statistics
    let totalVisits = result.length;
    let totalCompleted = 0;
    let totalCancelled = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalRevenue = 0;
    let genderStats = { L: 0, P: 0 };
    const serviceBreakdown: Record<string, number> = {};

    result.forEach((v) => {
      // Completed vs Cancelled
      if (v.status === "completed") {
        totalCompleted++;
      } else {
        totalCancelled++;
      }

      // Payment & Revenue
      if (v.paymentStatus === "PAID") {
        totalPaid++;
        if (v.status === "completed") {
          totalRevenue += v.servicePrice;
        }
      } else {
        totalUnpaid++;
      }

      // Gender
      if (v.patientGender === "L") {
        genderStats.L++;
      } else if (v.patientGender === "P") {
        genderStats.P++;
      }

      // Service Breakdown (grouped by service name and branch name)
      if (v.serviceName) {
        const key = `${v.serviceName} (${v.branchName})`;
        serviceBreakdown[key] = (serviceBreakdown[key] || 0) + 1;
      }

      // Branch Breakdown accumulation
      if (v.branchId && branchBreakdown[v.branchId]) {
        const b = branchBreakdown[v.branchId];
        b.totalVisits++;
        if (v.status === "completed") {
          b.totalCompleted++;
        }
        if (v.paymentStatus === "PAID" && v.status === "completed") {
          b.totalRevenue += v.servicePrice;
        }
        if (v.paymentStatus === "PAID") {
          b.totalPaid++;
        } else {
          b.totalUnpaid++;
        }
        if (v.patientGender === "L") {
          b.L++;
        } else if (v.patientGender === "P") {
          b.P++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      targetDate,
      summary: {
        totalVisits,
        totalCompleted,
        totalCancelled,
        totalPaid,
        totalUnpaid,
        totalRevenue,
        genderStats,
      },
      serviceBreakdown,
      branchBreakdown,
      visits: result,
    });
  } catch (error) {
    console.error("GET /api/patient-visits/daily-recap error:", error);
    return NextResponse.json({ error: "Gagal memuat rekap harian" }, { status: 500 });
  }
}
