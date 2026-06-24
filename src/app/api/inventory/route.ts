import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inventoryItems } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allItems = await db.select().from(inventoryItems).orderBy(desc(inventoryItems.updatedAt));
    return NextResponse.json(allItems);
  } catch (error) {
    console.error("Failed to fetch inventory items:", error);
    return NextResponse.json({ error: "Failed to fetch inventory items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, unit, currentStock, minStockAlert } = body;

    if (!name || !category || !unit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newItem = {
      id: crypto.randomUUID(),
      name,
      category,
      unit,
      currentStock: currentStock ? parseInt(currentStock) : 0,
      minStockAlert: minStockAlert ? parseInt(minStockAlert) : 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(inventoryItems).values(newItem);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Failed to create inventory item:", error);
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
  }
}
