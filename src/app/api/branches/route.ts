import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/branches — List branches
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    let result;
    if (all) {
      result = await db.select().from(branches);
    } else {
      result = await db
        .select()
        .from(branches)
        .where(eq(branches.isActive, true));
    }

    return Response.json({ data: result });
  } catch (error) {
    console.error("GET /api/branches error:", error);
    return Response.json({ error: "Gagal mengambil data cabang" }, { status: 500 });
  }
}

// POST /api/branches — Create a new branch
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, address, phone, whatsappNumber, operatingHours, operatingHoursWeekend, mapUrl, isActive } = body;

    if (!id || !name || !address || !phone || !whatsappNumber) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newBranch = await db.insert(branches).values({
      id,
      name,
      address,
      phone,
      whatsappNumber,
      operatingHours: operatingHours || "09:00 - 21:00 WIB",
      operatingHoursWeekend: operatingHoursWeekend || "09:00 - 21:00 WIB",
      mapUrl: mapUrl || null,
      isActive: isActive !== undefined ? isActive : true,
    }).returning();

    return Response.json({ message: "Branch created successfully", data: newBranch[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/branches error:", error);
    return Response.json({ error: "Gagal membuat cabang" }, { status: 500 });
  }
}
