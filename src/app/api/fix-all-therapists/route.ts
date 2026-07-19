import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { therapists, therapistCommissions, therapistServiceCommissions, financeTransactions, patientVisits } from "@/lib/db/schema";
import { eq, and, like } from "drizzle-orm";

export async function GET() {
  try {
    const allTherapists = await db.select().from(therapists);
    const activeTherapists = allTherapists.filter(t => t.isActive);
    
    // Find a reference therapist for global commissions
    // We assume the therapist with the MOST custom overrides has the most complete "global" picture
    let refTherapist = null;
    let maxOverrides = -1;
    let globalComms: any[] = [];
    
    for (const t of activeTherapists) {
      const comms = await db.select().from(therapistServiceCommissions).where(eq(therapistServiceCommissions.therapistId, t.id));
      if (comms.length > maxOverrides) {
        maxOverrides = comms.length;
        refTherapist = t;
        globalComms = comms;
      }
    }

    if (!refTherapist || globalComms.length === 0) {
      return NextResponse.json({ error: "No reference therapist found with commissions" }, { status: 400 });
    }

    let totalFixedCommissions = 0;
    let totalFixedOverrides = 0;

    for (const t of allTherapists) {
      // 1. Fix missing/incorrect overrides for each active therapist
      if (t.isActive) {
        const tComms = await db.select().from(therapistServiceCommissions).where(eq(therapistServiceCommissions.therapistId, t.id));
        for (const gComm of globalComms) {
          const existing = tComms.find(c => c.serviceId === gComm.serviceId);
          if (!existing) {
            await db.insert(therapistServiceCommissions).values({
              id: crypto.randomUUID(),
              therapistId: t.id,
              serviceId: gComm.serviceId,
              commissionAmount: gComm.commissionAmount,
            });
            totalFixedOverrides++;
          } else if (existing.commissionAmount !== gComm.commissionAmount) {
            await db.update(therapistServiceCommissions)
              .set({ commissionAmount: gComm.commissionAmount })
              .where(eq(therapistServiceCommissions.id, existing.id));
            totalFixedOverrides++;
          }
        }
      }

      // 2. Fix historical commissions for all therapists (even inactive ones)
      const pastCommissions = await db.select().from(therapistCommissions).where(eq(therapistCommissions.therapistId, t.id));
      for (const comm of pastCommissions) {
        const visitRecords = await db.select().from(patientVisits).where(eq(patientVisits.id, comm.visitId)).limit(1);
        if (visitRecords.length > 0) {
          const visit = visitRecords[0];
          const expectedComm = globalComms.find(g => g.serviceId === visit.serviceId);
          
          if (expectedComm && expectedComm.commissionAmount !== null && expectedComm.commissionAmount !== comm.amount) {
            await db.update(therapistCommissions)
              .set({ amount: expectedComm.commissionAmount })
              .where(eq(therapistCommissions.id, comm.id));
              
            await db.update(financeTransactions)
              .set({ amount: expectedComm.commissionAmount })
              .where(and(
                eq(financeTransactions.referenceId, comm.visitId),
                eq(financeTransactions.type, "EXPENSE"),
                like(financeTransactions.description, "%Bagi Hasil Terapis%")
              ));
              
            totalFixedCommissions++;
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      referenceTherapist: refTherapist.name,
      totalFixedOverrides, 
      totalFixedCommissions 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
