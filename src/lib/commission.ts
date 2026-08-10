import { eq, and } from "drizzle-orm";
import { services, serviceBranchPrices } from "@/lib/db/schema";

/**
 * ⚠️ WARNING UNTUK AI AGENTS & DEVELOPERS:
 * FUNGSI INI ADALAH SINGLE SOURCE OF TRUTH UNTUK PERHITUNGAN KOMISI TERAPIS.
 * DILARANG KERAS membuat ulang logika perhitungan komisi di file lain.
 * Selalu panggil fungsi ini jika Anda perlu menghitung komisi.
 * 
 * Hierarki Komisi:
 * 1. Branch Commission Override (service_branch_prices.commission)
 * 2. MURNI dari Global Commission (services.globalCommission)
 * 
 * @param dbInstance - Instance Drizzle DB (bisa `db` biasa atau `tx` dari transaksi)
 * @param therapistId - ID terapis
 * @param serviceId - ID layanan terapi
 * @param qty - Jumlah layanan (default 1)
 * @returns Nominal komisi total yang berhak didapatkan
 */
export function calculateCommissionAmount(params: {
  overrideCommission?: number | null; // Deprecated
  branchCommission?: number | null; // Deprecated
  serviceGlobalCommission?: number | null;
  therapistCommissionRate?: number | null; // Deprecated
  serviceCategory?: string | null; // Deprecated
  servicePrice?: number;
  qty: number;
}): number {
  const qty = params.qty || 0;
  const price = params.servicePrice || 0;

  const resolveAmount = (val: number) => {
    if (val > 0 && val <= 100) {
      return (val / 100) * price;
    }
    return val;
  };

  if (params.serviceGlobalCommission != null && params.serviceGlobalCommission > 0) {
    return resolveAmount(params.serviceGlobalCommission) * qty;
  }

  return 0;
}

export async function calculateTherapistCommission(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbInstance: any,
  therapistId: string, // Kept for signature compatibility
  serviceId: string,
  qty: number = 1,
  transactionBranchId?: string,
  cache?: {
    services?: Map<string, { gc: number | null; price: number; name: string }>;
  }
): Promise<number> {
  // Global, Price
  let serviceGlobalCommission: number | null = 0;
  let servicePrice = 0;
  
  if (cache?.services && cache.services.has(serviceId)) {
    const cachedSvc = cache.services.get(serviceId)!;
    serviceGlobalCommission = cachedSvc.gc;
    servicePrice = cachedSvc.price;
  } else {
    const svcRow = await dbInstance
      .select({ gc: services.globalCommission, price: services.price, name: services.name })
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    serviceGlobalCommission = svcRow.length > 0 ? svcRow[0].gc : 0;
    servicePrice = svcRow.length > 0 ? svcRow[0].price : 0;
    
    if (cache?.services) {
      cache.services.set(serviceId, { gc: serviceGlobalCommission, price: servicePrice, name: svcRow.length > 0 ? svcRow[0].name : "" });
    }
  }

  if (transactionBranchId) {
    const branchPriceRow = await dbInstance
      .select({
        price: serviceBranchPrices.price,
        commission: serviceBranchPrices.commission
      })
      .from(serviceBranchPrices)
      .where(
        and(
          eq(serviceBranchPrices.serviceId, serviceId),
          eq(serviceBranchPrices.branchId, transactionBranchId)
        )
      )
      .limit(1);

    if (branchPriceRow.length > 0) {
      servicePrice = branchPriceRow[0].price; // Set overriden price
      if (branchPriceRow[0].commission !== null) {
        serviceGlobalCommission = branchPriceRow[0].commission; // Set overriden commission
      }
    }
  }

  return calculateCommissionAmount({
    serviceGlobalCommission,
    servicePrice,
    qty
  });
}
