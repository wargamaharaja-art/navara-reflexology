import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { therapistServiceCommissions, therapists } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let branchFilter = searchParams.get("branchId") || await getActiveBranchFilter();
    if (branchFilter === "ALL") branchFilter = null;

    const activeTherapistsConditions = [eq(therapists.isActive, true)];
    if (branchFilter) {
      activeTherapistsConditions.push(eq(therapists.branchId, branchFilter));
    }

    // Ambil semua terapis aktif
    const activeTherapists = await db
      .select()
      .from(therapists)
      .where(and(...activeTherapistsConditions));

    // Ambil semua komisi khusus
    const allCommissions = await db.select().from(therapistServiceCommissions);

    // Hitung berapa banyak terapis yang aktif
    const totalActiveTherapists = activeTherapists.length;

    // Kelompokkan komisi berdasarkan serviceId
    const commissionByService: Record<string, number[]> = {};
    
    // Hanya hitung komisi untuk terapis yang aktif
    const activeTherapistIds = new Set(activeTherapists.map(t => t.id));
    
    allCommissions.forEach(c => {
      if (activeTherapistIds.has(c.therapistId)) {
        if (!commissionByService[c.serviceId]) {
          commissionByService[c.serviceId] = [];
        }
        commissionByService[c.serviceId].push(c.commissionAmount);
      }
    });

    const globalCommissions: Record<string, { amount: number | null, isUniform: boolean, activeCount: number }> = {};

    Object.keys(commissionByService).forEach(serviceId => {
      const amounts = commissionByService[serviceId];
      // Jika jumlah record komisi sama dengan jumlah terapis aktif, 
      // DAN semua nominal komisi sama persis
      const allSame = amounts.every(a => a === amounts[0]);
      if (amounts.length === totalActiveTherapists && allSame) {
        globalCommissions[serviceId] = { amount: amounts[0], isUniform: true, activeCount: amounts.length };
      } else {
        globalCommissions[serviceId] = { amount: null, isUniform: false, activeCount: amounts.length };
      }
    });

    return NextResponse.json({ 
      success: true, 
      globalCommissions,
      totalActiveTherapists 
    });

  } catch (error) {
    console.error("GET /api/therapist-service-commissions/sync-all error:", error);
    return NextResponse.json({ error: "Gagal memuat status komisi global" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { syncItems, branchId } = body; 

    if (!Array.isArray(syncItems)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    let branchFilter = branchId || await getActiveBranchFilter();
    if (branchFilter === "ALL") branchFilter = null;

    const activeTherapistsConditions2 = [eq(therapists.isActive, true)];
    if (branchFilter) {
      activeTherapistsConditions2.push(eq(therapists.branchId, branchFilter));
    }

    // Ambil semua terapis yang aktif
    const activeTherapists = await db
      .select()
      .from(therapists)
      .where(and(...activeTherapistsConditions2));

    if (activeTherapists.length === 0) {
      return NextResponse.json({ error: "Tidak ada terapis aktif untuk disinkronisasi" }, { status: 400 });
    }

    for (const item of syncItems) {
      const { serviceId, commissionAmount } = item;
      
      if (!serviceId) continue;

      // 1. Hapus semua override komisi khusus untuk layanan ini, khusus untuk terapis di cabang yang dipilih
      const activeTherapistIds = activeTherapists.map(t => t.id);
      if (activeTherapistIds.length > 0) {
        // Drizzle ORM does not support `inArray` with empty array, so we check first
        await db
          .delete(therapistServiceCommissions)
          .where(
            and(
              eq(therapistServiceCommissions.serviceId, serviceId),
              inArray(therapistServiceCommissions.therapistId, activeTherapistIds)
            )
          );
      }

      // 2. Jika commissionAmount diberikan (bukan null), buat override untuk SEMUA terapis aktif
      if (commissionAmount !== null && commissionAmount !== undefined) {
        const amt = parseInt(commissionAmount);
        if (!isNaN(amt) && amt >= 0) {
          const insertData = activeTherapists.map(t => ({
            id: `TC-${Date.now()}-${Math.random().toString(36).substring(2, 5)}-${t.id.substring(0,4)}`,
            therapistId: t.id,
            serviceId: serviceId,
            commissionAmount: amt
          }));

          // Insert batch
          if (insertData.length > 0) {
            await db.insert(therapistServiceCommissions).values(insertData);
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Sinkronisasi berhasil diterapkan ke semua terapis aktif" });
  } catch (error) {
    console.error("POST /api/therapist-service-commissions/sync-all error:", error);
    return NextResponse.json({ error: "Gagal menyinkronkan komisi khusus" }, { status: 500 });
  }
}
