import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET: Public endpoint - fetch invoice detail by ID (no auth required)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Struk tidak ditemukan" }, { status: 404 });
    }

    const invoice = result[0];

    return NextResponse.json({
      data: {
        ...invoice,
        items: JSON.parse(invoice.items),
      }
    });
  } catch (error) {
    console.error("GET /api/invoices/[id] error:", error);
    return NextResponse.json({ error: "Gagal memuat struk" }, { status: 500 });
  }
}
