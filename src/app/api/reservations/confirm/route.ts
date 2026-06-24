import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reservations, patientVisits, patients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, therapistId } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID reservasi diperlukan" }, { status: 400 });
    }

    // Fetch the reservation
    const resData = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
    if (resData.length === 0) {
      return NextResponse.json({ error: "Reservasi tidak ditemukan" }, { status: 404 });
    }

    const reservation = resData[0];

    // 1. Update reservation status
    await db.update(reservations)
      .set({ status: "CONFIRMED", updatedAt: new Date().toISOString() })
      .where(eq(reservations.id, id));

    // 2. Check if patient exists, or create new patient
    let patientId = "";
    const existingPatient = await db.select().from(patients).where(eq(patients.phone, reservation.customerPhone)).limit(1);

    if (existingPatient.length > 0) {
      patientId = existingPatient[0].id;
    } else {
      patientId = `P-${Date.now()}`;
      await db.insert(patients).values({
        id: patientId,
        name: reservation.customerName,
        phone: reservation.customerPhone,
      });
    }

    // 3. Insert into patient_visits so it shows up in calendar and POS
    const newVisitId = `V-${Date.now()}`;
    await db.insert(patientVisits).values({
      id: newVisitId,
      patientId,
      serviceId: reservation.serviceId,
      branchId: reservation.branchId,
      therapistId: therapistId || null,
      visitDate: reservation.date,
      visitTime: reservation.time,
      notes: `Reservasi Web: ${reservation.notes || "-"}`,
      status: "completed", 
      paymentStatus: "UNPAID",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error confirming reservation:", error);
    return NextResponse.json({ error: "Gagal mengkonfirmasi reservasi" }, { status: 500 });
  }
}
