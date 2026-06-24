import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/services — List all active services (or all if ?all=true)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    let query = db.select().from(services);
    if (!all) {
      query = query.where(eq(services.isActive, true)) as any;
    }

    const result = await query;

    return Response.json({ data: result });
  } catch (error) {
    console.error("GET /api/services error:", error);
    return Response.json({ error: "Gagal mengambil data layanan" }, { status: 500 });
  }
}

// POST /api/services — Create a new service
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, durationMinutes, category, isActive } = body;

    if (!name || !description || price === undefined || !durationMinutes) {
      return Response.json({ error: "Data layanan tidak lengkap" }, { status: 400 });
    }

    const newId = `SRV-${Date.now()}`;
    const result = await db.insert(services).values({
      id: newId,
      name,
      description,
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      category: category || "Paket Treatment",
      isActive: isActive !== undefined ? isActive : true,
    }).returning();

    return Response.json({ data: result[0] });
  } catch (error) {
    console.error("POST /api/services error:", error);
    return Response.json({ error: "Gagal membuat layanan baru" }, { status: 500 });
  }
}
