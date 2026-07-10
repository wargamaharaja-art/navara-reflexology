import { db } from "@/lib/db";
import { patientVisits, patients, therapists } from "@/lib/db/schema";
import { eq, desc, and, like, isNull } from "drizzle-orm";
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
      serviceId, serviceIds, branchId, therapistId, visitDate, visitTime, 
      checkInTime, checkOutTime, // Jam masuk & keluar
      bloodPressure, notes, status // Visit info
    } = body;

    const finalServiceIds = serviceIds && serviceIds.length > 0 ? serviceIds : (serviceId ? [serviceId] : []);

    if (!phone || !name || finalServiceIds.length === 0 || !branchId || !visitDate || !visitTime) {
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
        // Cek apakah sebenarnya sudah overdue
        const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
        const nowJkt = new Date(nowStr);
        const currentTime = `${String(nowJkt.getHours()).padStart(2, "0")}:${String(nowJkt.getMinutes()).padStart(2, "0")}`;
        const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

        const activeVisit = await db
          .select({ id: patientVisits.id, checkOutTime: patientVisits.checkOutTime, visitDate: patientVisits.visitDate })
          .from(patientVisits)
          .where(
            and(
              eq(patientVisits.therapistId, therapistId),
              eq(patientVisits.status, "in_progress"),
              isNull(patientVisits.actualCheckOutTime)
              // Jangan batasi visitDate hari ini, agar bisa mendeteksi nyangkut dari hari sebelumnya
            )
          )
          .limit(1);

        const isStuckFromYesterday = activeVisit.length > 0 && activeVisit[0].visitDate < todayStr;
        const isOverdueToday = activeVisit.length > 0 && activeVisit[0].visitDate === todayStr && activeVisit[0].checkOutTime && activeVisit[0].checkOutTime <= currentTime;
        const hasNoActiveVisitAtAll = activeVisit.length === 0;

        if (hasNoActiveVisitAtAll || isStuckFromYesterday || isOverdueToday) {
          // Overdue / Stale! Auto release now so we can proceed
          if (activeVisit.length > 0) {
            await db
              .update(patientVisits)
              .set({
                actualCheckOutTime: isStuckFromYesterday ? "23:59" : currentTime,
                status: "completed",
                updatedAt: new Date().toISOString(),
              })
              .where(eq(patientVisits.id, activeVisit[0].id));
          }
            
          await db
            .update(therapists)
            .set({ availabilityStatus: "AVAILABLE" })
            .where(eq(therapists.id, therapistId));
        } else {
          return Response.json(
            { error: "Terapis baru saja dipilih oleh admin lain. Silakan pilih terapis lain." },
            { status: 409 }
          );
        }
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
    for (const sId of finalServiceIds) {
      const duplicateConditions: any[] = [
        eq(patientVisits.patientId, patientId),
        eq(patientVisits.serviceId, sId),
        like(patientVisits.visitDate, visitDate),
        eq(patientVisits.status, "in_progress")
      ];
      if (therapistId) {
        duplicateConditions.push(eq(patientVisits.therapistId, therapistId));
      }

      const duplicateCheck = await db
        .select({ id: patientVisits.id })
        .from(patientVisits)
        .where(and(...duplicateConditions))
        .limit(1);

      if (duplicateCheck.length > 0) {
        return Response.json(
          { error: "Kunjungan duplikat: pasien ini sudah tercatat untuk layanan yang sama pada tanggal tersebut.", duplicateVisitId: duplicateCheck[0].id },
          { status: 409 }
        );
      }
    }

    // Tentukan status kunjungan: jika ada checkInTime + terapis, berarti sedang berlangsung
    const visitStatus = (checkInTime && therapistId) ? "in_progress" : (status || "completed");

    // 4. Buat record kunjungan
    const insertedVisits = [];
    for (const sId of finalServiceIds) {
      // Use random string to ensure unique ID in tight loop
      const newVisitId = `V-${Date.now()}-${Math.floor(Math.random()*10000)}`;
      const result = await db.insert(patientVisits).values({
        id: newVisitId,
        patientId,
        serviceId: sId,
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
      insertedVisits.push(result[0]);
    }

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

    return Response.json({ data: insertedVisits[0], patientId });
  } catch (error) {
    console.error("POST /api/patient-visits error:", error);
    return Response.json({ error: "Gagal mencatat kunjungan" }, { status: 500 });
  }
}
