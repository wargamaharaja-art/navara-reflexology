import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { therapistServiceCommissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

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

    if (!id) {
      return NextResponse.json({ error: "Override ID is required" }, { status: 400 });
    }

    await db.delete(therapistServiceCommissions).where(eq(therapistServiceCommissions.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/therapist-service-commissions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete service commission override." },
      { status: 500 }
    );
  }
}
