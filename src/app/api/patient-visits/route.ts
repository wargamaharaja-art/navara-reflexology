import { db } from "@/lib/db";
import { patientVisits, patients, therapists } from "@/lib/db/schema";
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
      serviceId, branchId, therapistId, visitDate, visitTime, 
      checkInTime, checkOutTime, // Jam masuk & keluar
      bloodPressure, notes, status // Visit info
    } = body;

    if (!phone || !name || !serviceId || !branchId || !visitDate || !visitTime) {
      return Response.json({ error: "Data kunjungan atau pasien tidak lengkap" }, { status: 400 });
    }

    // Enforce branch context for branch admin
    const finalBranchId = session.role === "BRANCH_ADMIN" ? session.branchId : branchId;
    if (!finalBranchId) {
      return Response.json({ error: "Cabang wajib ditentukan" }, { status: 400 });
    }

    // === OPTIMISTIC LOCK: Cek apakah terapis masih AVAILABLE ===
    if (therapistId && checkInTime) {
      const therapistCheck = await db
        .select({ id: therapists.id, availabilityStatus: therapists.availabilityStatus })
        .from(therapists)
        .where(eq(therapists.id, therapistId))
        .limit(1);

      if (therapistCheck.length > 0 && therapistCheck[0].availabilityStatus === "BUSY") {
        return Response.json(
          { error: "Terapis baru saja dipilih oleh admin lain. Silakan pilih terapis lain." },
          { status: 409 }
        );
      }

      if (therapistCheck.length > 0 && (therapistCheck[0].availabilityStatus === "BREAK" || therapistCheck[0].availabilityStatus === "OFF")) {
        return Response.json(
          { error: "Terapis sedang tidak tersedia (istirahat/tidak masuk). Silakan pilih terapis lain." },
          { status: 409 }
        );
      }
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

    // Tentukan status kunjungan: jika ada checkInTime + terapis, berarti sedang berlangsung
    const visitStatus = (checkInTime && therapistId) ? "in_progress" : (status || "completed");

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
      checkInTime: checkInTime || null,
      checkOutTime: checkOutTime || null,
      therapistStatusSnapshot: therapistId ? "BUSY" : null,
      bloodPressure: bloodPressure || null,
      notes: notes || null,
      status: visitStatus,
    }).returning();

    // === AUTO-LOCK TERAPIS: Set status BUSY setelah kunjungan tersimpan ===
    if (therapistId && checkInTime) {
      await db
        .update(therapists)
        .set({ availabilityStatus: "BUSY" })
        .where(
          and(
            eq(therapists.id, therapistId),
            eq(therapists.availabilityStatus, "AVAILABLE") // Double-check: hanya jika masih AVAILABLE
          )
        );
    }

    return Response.json({ data: result[0], patientId });
  } catch (error) {
    console.error("POST /api/patient-visits error:", error);
    return Response.json({ error: "Gagal mencatat kunjungan" }, { status: 500 });
  }
}
