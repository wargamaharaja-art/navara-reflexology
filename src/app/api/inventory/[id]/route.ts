import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryItems, inventoryTransactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, unit, currentStock, minStockAlert } = body;
    const { id } = await params;

    const updatedItem = await db.update(inventoryItems)
      .set({
        name,
        category,
        unit,
        currentStock: currentStock !== undefined ? parseInt(currentStock) : undefined,
        minStockAlert: minStockAlert !== undefined ? parseInt(minStockAlert) : undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(inventoryItems.id, id))
      .returning();

    if (updatedItem.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updatedItem[0]);
  } catch (error) {
    console.error("Failed to update inventory item:", error);
    return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Delete transactions first due to foreign key constraint
    await db.delete(inventoryTransactions).where(eq(inventoryTransactions.itemId, id));
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete inventory item:", error);
    return NextResponse.json({ error: "Failed to delete inventory item" }, { status: 500 });
  }
}
