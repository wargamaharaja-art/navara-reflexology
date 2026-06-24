import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financeTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(financeTransactions).where(eq(financeTransactions.id, id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete finance transaction:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
