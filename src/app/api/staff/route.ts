import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { staff } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branchFilter = await getActiveBranchFilter();
    const staffConditions = [];

    if (branchFilter) {
      staffConditions.push(eq(staff.branchId, branchFilter));
    }

    const allStaff = await db
      .select()
      .from(staff)
      .where(staffConditions.length > 0 ? and(...staffConditions) : undefined)
      .orderBy(desc(staff.joinedAt));
    
    return NextResponse.json({ success: true, data: allStaff });
  } catch (error) {
    console.error("Failed to fetch staff:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, role, phone, baseSalary, dailyAllowance, isActive, branchId } = body;

    if (!name || !role || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Enforce branch for branch admin
    const finalBranchId = session.role === "BRANCH_ADMIN" ? session.branchId : (branchId || null);

    const newStaff = {
      id: crypto.randomUUID(),
      name,
      role,
      phone,
      branchId: finalBranchId,
      baseSalary: baseSalary ? parseInt(baseSalary) : 0,
      dailyAllowance: dailyAllowance ? parseInt(dailyAllowance) : 0,
      isActive: isActive !== undefined ? isActive : true,
      joinedAt: new Date().toISOString(),
    };

    await db.insert(staff).values(newStaff);

    return NextResponse.json({ success: true, data: newStaff }, { status: 201 });
  } catch (error) {
    console.error("Failed to create staff:", error);
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
  }
}
