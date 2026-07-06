import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { therapists } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkBranchAccess, getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await db.select().from(therapists).where(eq(therapists.id, id)).limit(1);
    if (result.length === 0) {
      return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("GET /api/therapists/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch therapist" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, specialization, phone, gender, baseSalary, commissionRate, isActive, branchId, photoUrl, birthDate, pinCode, contractStartDate, contractEndDate } = body;

    const existing = await db.select().from(therapists).where(eq(therapists.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: "Therapist not found" }, { status: 404 });
    }
    
    // Check branch access
    const isAllowed = await checkBranchAccess(existing[0].branchId);
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden: Anda tidak memiliki akses ke data terapis ini" }, { status: 403 });
    }

    // Force branch for branch admin
    const finalBranchId = session.role === "BRANCH_ADMIN" ? session.branchId : branchId;

    const updatedTherapist = await db.update(therapists)
      .set({
        name,
        specialization,
        phone,
        gender,
        branchId: finalBranchId,
        photoUrl: photoUrl !== undefined ? photoUrl : undefined,
        birthDate: birthDate !== undefined ? birthDate : undefined,
        pinCode: pinCode !== undefined ? pinCode : undefined,
        contractStartDate: contractStartDate !== undefined ? contractStartDate : undefined,
        contractEndDate: contractEndDate !== undefined ? contractEndDate : undefined,
        baseSalary: baseSalary !== undefined ? parseInt(baseSalary) : undefined,
        commissionRate: commissionRate !== undefined ? parseInt(commissionRate) : undefined,
        isActive,
      })
      .where(eq(therapists.id, id))
      .returning();

    return NextResponse.json(updatedTherapist[0]);
  } catch (error) {
    console.error("Failed to update therapist:", error);
    return NextResponse.json({ error: "Failed to update therapist" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const existing = await db.select().from(therapists).where(eq(therapists.id, id)).limit(1);
    if (existing.length === 0) {
      return new NextResponse(null, { status: 204 }); // Already deleted
    }

    // Check branch access
    const isAllowed = await checkBranchAccess(existing[0].branchId);
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden: Anda tidak memiliki akses ke data terapis ini" }, { status: 403 });
    }

    await db.delete(therapists).where(eq(therapists.id, id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete therapist:", error);
    return NextResponse.json({ error: "Failed to delete therapist" }, { status: 500 });
  }
}
