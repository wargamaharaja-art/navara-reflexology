import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryItems, inventoryTransactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getActiveBranchFilter, getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, quantity, notes } = body;
    const { id } = await params;

    if (!type || !quantity || (type !== "IN" && type !== "OUT")) {
      return NextResponse.json({ error: "Invalid transaction data" }, { status: 400 });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: "Quantity must be a positive number" }, { status: 400 });
    }

    // Get active branch penempatan
    const branchId = await getActiveBranchFilter();
    if (!branchId) {
      return NextResponse.json({ error: "Silakan pilih cabang aktif di sidebar terlebih dahulu sebelum mencatat mutasi." }, { status: 400 });
    }

    // Insert transaction with branchId
    const newTransaction = {
      id: crypto.randomUUID(),
      itemId: id,
      type,
      quantity: qty,
      notes: notes || "",
      branchId: branchId,
      date: new Date().toISOString(),
    };

    await db.insert(inventoryTransactions).values(newTransaction);

    // Update stock
    const stockChange = type === "IN" ? qty : -qty;
    
    await db.update(inventoryItems)
      .set({
        currentStock: sql`${inventoryItems.currentStock} + ${stockChange}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(inventoryItems.id, id));

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error("Failed to record transaction:", error);
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}
