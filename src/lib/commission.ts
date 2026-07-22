import { eq, and } from "drizzle-orm";
import { services, therapists, therapistServiceCommissions } from "@/lib/db/schema";

/**
 * ⚠️ WARNING UNTUK AI AGENTS & DEVELOPERS:
 * FUNGSI INI ADALAH SINGLE SOURCE OF TRUTH UNTUK PERHITUNGAN KOMISI TERAPIS.
 * DILARANG KERAS membuat ulang logika perhitungan komisi di file lain.
 * Selalu panggil fungsi ini jika Anda perlu menghitung komisi.
 * 
 * Hierarki Komisi:
 * 1. Override Commission (therapistServiceCommissions)
 * 2. Global Commission (services.globalCommission)
 * 3. Flat Rate Commission (therapists.commissionRate)
 * 
 * @param dbInstance - Instance Drizzle DB (bisa `db` biasa atau `tx` dari transaksi)
 * @param therapistId - ID terapis
 * @param serviceId - ID layanan terapi
 * @param qty - Jumlah layanan (default 1)
 * @returns Nominal komisi total yang berhak didapatkan
 */
export function calculateCommissionAmount(params: {
  overrideCommission?: number | null;
  serviceGlobalCommission?: number | null;
  therapistCommissionRate?: number | null;
  qty: number;
}): number {
  const qty = params.qty || 0;

  if (params.overrideCommission != null) {
    return params.overrideCommission * qty;
  }

  if (params.serviceGlobalCommission != null && params.serviceGlobalCommission > 0) {
    return params.serviceGlobalCommission * qty;
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
  // 1. Override
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

  // 2. Global
  const svcRow = await dbInstance
    .select({ gc: services.globalCommission })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  const serviceGlobalCommission = svcRow.length > 0 ? svcRow[0].gc : 0;

  // 3. Flat Rate
  const thRow = await dbInstance
    .select({ cr: therapists.commissionRate })
    .from(therapists)
    .where(eq(therapists.id, therapistId))
    .limit(1);

  const therapistCommissionRate = thRow.length > 0 ? thRow[0].cr : 0;

  return calculateCommissionAmount({
    overrideCommission,
    serviceGlobalCommission,
    therapistCommissionRate,
    qty
  });
}
