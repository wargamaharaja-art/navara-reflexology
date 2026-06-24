import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    await db.insert(reservations).values({
      id: randomUUID(),
      customerName: data.name,
      customerPhone: data.phone,
      branchId: data.branch,
      serviceId: data.service,
      date: data.date,
      time: data.time,
      notes: data.notes || "",
      status: "PENDING",
    });

    return NextResponse.json({ success: true, message: "Reservation saved successfully." });
  } catch (error: any) {
    console.error("Error saving reservation:", error);
    return NextResponse.json({ success: false, error: "Failed to save reservation.", details: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchFilter = await getActiveBranchFilter();

    let query = db.select().from(reservations);
    if (branchFilter) {
      query = query.where(eq(reservations.branchId, branchFilter)) as any;
    }

    const list = await query.orderBy(desc(reservations.createdAt));
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch reservations." }, { status: 500 });
  }
}
