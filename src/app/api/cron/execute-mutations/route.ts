import { db } from "@/lib/db";
import { therapistMutations, therapists, systemLogs } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";

// GET /api/cron/execute-mutations
// Auto-execute APPROVED mutations when their effective date has arrived
// Called by client-side interval (similar to release-therapists cron)
export async function GET() {
  try {
    const now = new Date();
    const todayStr = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

    // Find all APPROVED mutations where effectiveDate <= today
    const pendingMutations = await db
      .select()
      .from(therapistMutations)
      .where(
        and(
          eq(therapistMutations.status, "APPROVED"),
          lte(therapistMutations.effectiveDate, todayStr)
        )
      );

    let executedCount = 0;
    const executedMutations: string[] = [];

    for (const m of pendingMutations) {
      // Verify therapist exists and is still active
      const therapist = await db
        .select()
        .from(therapists)
        .where(eq(therapists.id, m.therapistId))
        .limit(1);

      if (therapist.length === 0 || !therapist[0].isActive) {
        // Skip — therapist no longer valid, log the issue
        console.warn(`Cron: Skipping mutation ${m.mutationNumber} — therapist ${m.therapistId} not found or inactive`);
        continue;
      }

      const nowIso = new Date().toISOString();

      // Execute: update therapist branchId
      await db.update(therapists).set({
        branchId: m.toBranchId,
      }).where(eq(therapists.id, m.therapistId));

      // Update mutation status to EXECUTED
      await db.update(therapistMutations).set({
        status: "EXECUTED",
        executedAt: nowIso,
        updatedAt: nowIso,
      }).where(eq(therapistMutations.id, m.id));

      // System log
      await db.insert(systemLogs).values({
        id: crypto.randomUUID(),
        userId: "SYSTEM",
        userName: "Sistem Otomatis",
        action: "EXECUTE_MUTATION",
        entityType: "therapist_mutation",
        entityId: m.id,
        details: JSON.stringify({
          mutationNumber: m.mutationNumber,
          therapistId: m.therapistId,
          therapistName: therapist[0].name,
          fromBranchId: m.fromBranchId,
          toBranchId: m.toBranchId,
          effectiveDate: m.effectiveDate,
        }),
      });

      executedCount++;
      executedMutations.push(m.mutationNumber);
    }

    return Response.json({
      success: true,
      executedCount,
      executedMutations,
      checkedAt: todayStr,
    });
  } catch (error) {
    console.error("GET /api/cron/execute-mutations error:", error);
    return Response.json({ error: "Gagal mengeksekusi mutasi otomatis" }, { status: 500 });
  }
}
