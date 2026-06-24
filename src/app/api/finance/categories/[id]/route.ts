import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financeCategories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.update(financeCategories).set({ isActive: false }).where(eq(financeCategories.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
