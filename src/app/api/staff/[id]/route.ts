import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { staff } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, phone, baseSalary, dailyAllowance, isActive, branchId } = body;

    const existing = await db.select().from(staff).where(eq(staff.id, id));
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const updatedStaff = {
      name: name ?? existing[0].name,
      role: role ?? existing[0].role,
      phone: phone ?? existing[0].phone,
      branchId: branchId ?? existing[0].branchId,
      baseSalary: baseSalary !== undefined ? parseInt(baseSalary) : existing[0].baseSalary,
      dailyAllowance: dailyAllowance !== undefined ? parseInt(dailyAllowance) : existing[0].dailyAllowance,
      isActive: isActive !== undefined ? isActive : existing[0].isActive,
    };

    await db.update(staff).set(updatedStaff).where(eq(staff.id, id));

    return NextResponse.json({ success: true, data: { id, ...updatedStaff } });
  } catch (error) {
    console.error("Failed to update staff:", error);
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.delete(staff).where(eq(staff.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete staff:", error);
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}
