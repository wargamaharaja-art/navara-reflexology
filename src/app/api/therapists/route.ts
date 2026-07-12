import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { therapists, patientVisits, therapistCommissions } from "@/lib/db/schema";
import { eq, desc, and, like } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchFilter = await getActiveBranchFilter();

    const therapistsConditions: any[] = [];
    if (branchFilter) {
      therapistsConditions.push(eq(therapists.branchId, branchFilter));
    }

    const allTherapists = await db
      .select()
      .from(therapists)
      .where(therapistsConditions.length > 0 ? and(...therapistsConditions) : undefined)
      .orderBy(desc(therapists.joinedAt));

    // Bulan ini: format YYYY-MM
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Ambil semua kunjungan bulan ini (untuk patientsHandled)
    const visitsConditions: any[] = [
      eq(patientVisits.status, "completed"),
      like(patientVisits.visitDate, `${currentMonth}%`),
    ];
    if (branchFilter) {
      visitsConditions.push(eq(patientVisits.branchId, branchFilter));
    }
    const thisMonthVisits = await db
      .select()
      .from(patientVisits)
      .where(and(...visitsConditions));

    const commissionsConditions: any[] = [
      like(patientVisits.visitDate, `${currentMonth}%`)
    ];
    if (branchFilter) {
      commissionsConditions.push(eq(patientVisits.branchId, branchFilter));
    }

    // Ambil semua komisi bulan ini dari tabel therapistCommissions (join ke patientVisits untuk filter tanggal)
    const thisMonthCommissions = await db
      .select({
        therapistId: therapistCommissions.therapistId,
        amount: therapistCommissions.amount,
        visitDate: patientVisits.visitDate,
      })
      .from(therapistCommissions)
      .innerJoin(patientVisits, eq(therapistCommissions.visitId, patientVisits.id))
      .where(and(...commissionsConditions));

    const enriched = allTherapists.map(t => {
      // Pasien ditangani bulan ini
      const patientsHandled = thisMonthVisits.filter(v => v.therapistId === t.id).length;
      // Total komisi bulan ini
      const totalCommission = thisMonthCommissions
        .filter(c => c.therapistId === t.id)
        .reduce((sum, c) => sum + c.amount, 0);
      return { ...t, patientsHandled, totalCommission };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to fetch therapists:", error);
    return NextResponse.json({ error: "Failed to fetch therapists" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, specialization, phone, gender, baseSalary, commissionRate, isActive, branchId, photoUrl, birthDate, pinCode, contractStartDate, contractEndDate } = body;

    if (!name || !specialization || !phone || !gender) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Enforce branch for branch admin
    const finalBranchId = session.role === "BRANCH_ADMIN" ? session.branchId : (branchId || null);

    const newTherapist = {
      id: crypto.randomUUID(),
      name,
      specialization,
      phone,
      gender,
      branchId: finalBranchId,
      baseSalary: baseSalary ? parseInt(baseSalary) : 0,
      commissionRate: commissionRate ? parseInt(commissionRate) : 0,
      photoUrl: photoUrl || null,
      birthDate: birthDate || null,
      pinCode: pinCode || null,
      contractStartDate: contractStartDate || null,
      contractEndDate: contractEndDate || null,
      isActive: isActive !== undefined ? isActive : true,
      joinedAt: new Date().toISOString(),
    };

    await db.insert(therapists).values(newTherapist);

    return NextResponse.json(newTherapist, { status: 201 });
  } catch (error) {
    console.error("Failed to create therapist:", error);
    return NextResponse.json({ error: "Failed to create therapist" }, { status: 500 });
  }
}
