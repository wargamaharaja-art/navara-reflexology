import { eq, and } from "drizzle-orm";
import { services, therapists, therapistServiceCommissions, serviceBranchPrices } from "@/lib/db/schema";

/**
 * ⚠️ WARNING UNTUK AI AGENTS & DEVELOPERS:
 * FUNGSI INI ADALAH SINGLE SOURCE OF TRUTH UNTUK PERHITUNGAN KOMISI TERAPIS.
 * DILARANG KERAS membuat ulang logika perhitungan komisi di file lain.
 * Selalu panggil fungsi ini jika Anda perlu menghitung komisi.
 * 
 * Hierarki Komisi:
 * 1. Override Commission (therapistServiceCommissions)
 * 2. Branch Commission (serviceBranchPrices.commission) — jika ada override harga cabang
 * 3. Global Commission (services.globalCommission)
 * 4. Flat Rate Commission (therapists.commissionRate)
 * 
 * @param dbInstance - Instance Drizzle DB (bisa `db` biasa atau `tx` dari transaksi)
 * @param therapistId - ID terapis
 * @param serviceId - ID layanan terapi
 * @param qty - Jumlah layanan (default 1)
 * @returns Nominal komisi total yang berhak didapatkan
 */
export function calculateCommissionAmount(params: {
  overrideCommission?: number | null;
  branchCommission?: number | null;
  serviceGlobalCommission?: number | null;
  therapistCommissionRate?: number | null;
  serviceCategory?: string | null;
  qty: number;
}): number {
  const qty = params.qty || 0;

  if (params.overrideCommission != null) {
    return params.overrideCommission * qty;
  }

  // Check branch-specific commission override
  if (params.branchCommission != null) {
    if (params.branchCommission === -1) return 0; // Explicit bypass
    if (params.branchCommission > 0) return params.branchCommission * qty;
  }

  // Explicit bypass: if global commission is set to -1, it means strictly NO commission.
  if (params.serviceGlobalCommission === -1) {
    return 0;
  }

  if (params.serviceGlobalCommission != null && params.serviceGlobalCommission > 0) {
    return params.serviceGlobalCommission * qty;
  }

  // Do not fallback to therapist's flat rate if it's an Adds On or Mcu and its commission is 0.
  // Therapist's flat rate (e.g. 20000 or 35000) is meant for main treatments, not for selling member cards or water.
  const isNonTreatment = params.serviceCategory === "Adds On" || params.serviceCategory === "Mcu";
  if (isNonTreatment && (params.serviceGlobalCommission === 0 || params.serviceGlobalCommission == null)) {
    return 0;
  }

  if (params.therapistCommissionRate != null && params.therapistCommissionRate > 0) {
    return params.therapistCommissionRate * qty;
  }

  return 0;
}

export async function calculateTherapistCommission(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbInstance: any,
  therapistId: string,
  serviceId: string,
  qty: number = 1
): Promise<number> {
  // 1. Therapist-specific override
  const overrideRow = await dbInstance
    .select({ amount: therapistServiceCommissions.commissionAmount })
    .from(therapistServiceCommissions)
    .where(
      and(
        eq(therapistServiceCommissions.therapistId, therapistId),
        eq(therapistServiceCommissions.serviceId, serviceId)
      )
    )
    .limit(1);
    
  const overrideCommission = overrideRow.length > 0 ? overrideRow[0].amount : null;

  // 2. Get service info (global commission + category)
  const svcRow = await dbInstance
    .select({ gc: services.globalCommission, category: services.category })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  const serviceGlobalCommission = svcRow.length > 0 ? svcRow[0].gc : 0;
  const serviceCategory = svcRow.length > 0 ? svcRow[0].category : null;

  // 3. Branch-specific commission (from therapist's branch)
  let branchCommission: number | null = null;
  const thRow = await dbInstance
    .select({ cr: therapists.commissionRate, branchId: therapists.branchId })
    .from(therapists)
    .where(eq(therapists.id, therapistId))
    .limit(1);

  const therapistCommissionRate = thRow.length > 0 ? thRow[0].cr : 0;
  const therapistBranchId = thRow.length > 0 ? thRow[0].branchId : null;

  if (therapistBranchId) {
    const branchPriceRow = await dbInstance
      .select({ commission: serviceBranchPrices.commission })
      .from(serviceBranchPrices)
      .where(
        and(
          eq(serviceBranchPrices.serviceId, serviceId),
          eq(serviceBranchPrices.branchId, therapistBranchId)
        )
      )
      .limit(1);

    if (branchPriceRow.length > 0 && branchPriceRow[0].commission != null) {
      branchCommission = branchPriceRow[0].commission;
    }
  }

  return calculateCommissionAmount({
    overrideCommission,
    branchCommission,
    serviceGlobalCommission,
    therapistCommissionRate,
    serviceCategory,
    qty
  });
}
