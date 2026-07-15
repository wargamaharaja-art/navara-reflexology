import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { therapistServiceCommissions, services } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get("therapistId");

    if (!therapistId) {
      return NextResponse.json({ error: "Therapist ID is required" }, { status: 400 });
    }

    // Ambil semua layanan (services)
    const allServices = await db.select().from(services);

    // Ambil override komisi untuk terapis ini
    const overrides = await db
      .select()
      .from(therapistServiceCommissions)
      .where(eq(therapistServiceCommissions.therapistId, therapistId));

    // Gabungkan data layanan dengan override jika ada
    const data = allServices.map((service) => {
      const override = overrides.find((o) => o.serviceId === service.id);
      return {
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price,
        commissionAmount: override ? override.commissionAmount : null,
        overrideId: override ? override.id : null,
      };
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("GET /api/therapist-service-commissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch service commissions." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { therapistId, serviceId, commissionAmount } = body;

    if (!therapistId || !serviceId || commissionAmount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if an override already exists
    const existing = await db
      .select()
      .from(therapistServiceCommissions)
      .where(
        and(
          eq(therapistServiceCommissions.therapistId, therapistId),
          eq(therapistServiceCommissions.serviceId, serviceId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(therapistServiceCommissions)
        .set({
          commissionAmount: parseInt(commissionAmount),
        })
        .where(eq(therapistServiceCommissions.id, existing[0].id));
    } else {
      // Insert new
      const crypto = require("crypto");
      await db.insert(therapistServiceCommissions).values({
        id: crypto.randomUUID(),
        therapistId,
        serviceId,
        commissionAmount: parseInt(commissionAmount),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/therapist-service-commissions error:", error);
    return NextResponse.json(
      { error: "Failed to save service commission." },
      { status: 500 }
    );
  }
}
