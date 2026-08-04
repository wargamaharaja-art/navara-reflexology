import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemLogs } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    // Allow SUPER_ADMIN or those with SYSTEM_LOGS permission
    const perms = session?.permissions || [];
    if (!session || (!perms.includes("SYSTEM_LOGS") && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 100;

    const logs = await db
      .select()
      .from(systemLogs)
      .orderBy(desc(systemLogs.createdAt))
      .limit(limit);

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("Failed to fetch system logs:", error);
    return NextResponse.json({ error: "Gagal mengambil log sistem" }, { status: 500 });
  }
}
