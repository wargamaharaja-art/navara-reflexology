"use server";

import { db } from "@/lib/db";
import { reservations, patients, patientVisits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { checkBranchAccess } from "@/lib/auth";

export async function confirmReservation(reservationId: string, formData: FormData) {
  const therapistId = formData.get("therapistId") as string;
  
  // 1. Fetch reservation
  const resList = await db.select().from(reservations).where(eq(reservations.id, reservationId)).limit(1);
  if (resList.length === 0) return;
  const res = resList[0];

  // Enforce branch access check
  const isAllowed = await checkBranchAccess(res.branchId);
  if (!isAllowed) {
    throw new Error("Forbidden: Anda tidak memiliki akses ke cabang ini");
  }

  // 2. Check if patient exists by phone, if not create
  const existingPatients = await db.select().from(patients).where(eq(patients.phone, res.customerPhone)).limit(1);
  let patientId = "";
  
  if (existingPatients.length > 0) {
    patientId = existingPatients[0].id;
  } else {
    patientId = randomUUID();
    await db.insert(patients).values({
      id: patientId,
      name: res.customerName,
      phone: res.customerPhone,
    });
  }

  // 3. Create Patient Visit
  const visitId = randomUUID();
  await db.insert(patientVisits).values({
    id: visitId,
    patientId: patientId,
    serviceId: res.serviceId,
    branchId: res.branchId,
    therapistId: therapistId,
    visitDate: res.date,
    visitTime: res.time,
    notes: res.notes,
    status: "completed",
  });

  // 4. Update reservation status
  await db.update(reservations).set({ status: "CONFIRMED" }).where(eq(reservations.id, reservationId));

  revalidatePath("/admin/reservations");
}

export async function rejectReservation(reservationId: string) {
  // Fetch reservation to check access
  const resList = await db.select().from(reservations).where(eq(reservations.id, reservationId)).limit(1);
  if (resList.length === 0) return;
  const res = resList[0];

  const isAllowed = await checkBranchAccess(res.branchId);
  if (!isAllowed) {
    throw new Error("Forbidden: Anda tidak memiliki akses ke cabang ini");
  }

  await db.update(reservations).set({ status: "CANCELLED" }).where(eq(reservations.id, reservationId));
  revalidatePath("/admin/reservations");
}
