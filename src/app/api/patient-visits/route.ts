import { db } from "@/lib/db";
import { patientVisits, patients } from "@/lib/db/schema";
import { eq, desc, and, like } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchFilter = await getActiveBranchFilter();

    const visitConditions = [];
    if (branchFilter) {
      visitConditions.push(eq(patientVisits.branchId, branchFilter));
    }

    const result = await db
      .select()
      .from(patientVisits)
      .where(visitConditions.length > 0 ? and(...visitConditions) : undefined)
      .orderBy(desc(patientVisits.visitDate), desc(patientVisits.visitTime));
    return Response.json({ data: result });
  } catch (error) {
    console.error("GET /api/patient-visits error:", error);
    return Response.json({ error: "Gagal mengambil data kunjungan" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      phone, name, address, gender, // Patient info
      serviceId, branchId, therapistId, visitDate, visitTime, notes, status // Visit info
    } = body;

    if (!phone || !name || !serviceId || !branchId || !visitDate || !visitTime) {
      return Response.json({ error: "Data kunjungan atau pasien tidak lengkap" }, { status: 400 });
    }

    // Enforce branch context for branch admin
    const finalBranchId = session.role === "BRANCH_ADMIN" ? session.branchId : branchId;
    if (!finalBranchId) {
      return Response.json({ error: "Cabang wajib ditentukan" }, { status: 400 });
    }

    // 1. Cek apakah pasien dengan nomor telepon ini sudah ada
    let patientId = "";
    const existingPatient = await db.select().from(patients).where(eq(patients.phone, phone)).limit(1);

    if (existingPatient.length > 0) {
      patientId = existingPatient[0].id;
    } else {
      // 2. Buat pasien baru jika belum ada
      patientId = `P-${Date.now()}`;
      await db.insert(patients).values({
        id: patientId,
        name,
        phone,
        address: address || null,
        gender: gender || null,
      });
    }

    // 3. ISS-011: Cek duplikasi kunjungan (pasien + layanan + tanggal sama)
    const duplicateCheck = await db
      .select({ id: patientVisits.id })
      .from(patientVisits)
      .where(
        and(
          eq(patientVisits.patientId, patientId),
          eq(patientVisits.serviceId, serviceId),
          like(patientVisits.visitDate, visitDate)
        )
      )
      .limit(1);

    if (duplicateCheck.length > 0) {
      return Response.json(
        { error: "Kunjungan duplikat: pasien ini sudah tercatat untuk layanan yang sama pada tanggal tersebut.", duplicateVisitId: duplicateCheck[0].id },
        { status: 409 }
      );
    }

    // 4. Buat record kunjungan
    const newVisitId = `V-${Date.now()}`;
    const result = await db.insert(patientVisits).values({
      id: newVisitId,
      patientId,
      serviceId,
      branchId: finalBranchId,
      therapistId: therapistId || null,
      visitDate,
      visitTime,
      notes: notes || null,
      status: status || "completed",
    }).returning();

    return Response.json({ data: result[0], patientId });
  } catch (error) {
    console.error("POST /api/patient-visits error:", error);
    return Response.json({ error: "Gagal mencatat kunjungan" }, { status: 500 });
  }
}
