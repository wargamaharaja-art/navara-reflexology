import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance, therapists, branches } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pinCode, branchId, photoBase64 } = await request.json();

    if (!pinCode || !branchId || !photoBase64) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Find therapist by PIN
    const therapistQuery = await db
      .select()
      .from(therapists)
      .where(and(eq(therapists.pinCode, pinCode), eq(therapists.isActive, true)))
      .limit(1);

    if (therapistQuery.length === 0) {
      return NextResponse.json({ error: "PIN tidak valid atau terapis tidak aktif." }, { status: 404 });
    }

    const therapist = therapistQuery[0];

    // Check branch (optional: restrict if they must be at their assigned branch)
    if (session.role === "BRANCH_ADMIN" && branchId !== session.branchId) {
      return NextResponse.json({ error: "Anda hanya bisa mengakses Kiosk untuk cabang Anda." }, { status: 403 });
    }

    const dateStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
    const photoUrl = photoBase64; // Save directly as base64 string to avoid EROFS in serverless environments

    // 3. Update or Insert Attendance Record
    const existing = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.therapistId, therapist.id),
          eq(attendance.date, dateStr)
        )
      )
      .limit(1);

    const currentTime = new Date().toLocaleTimeString("sv-SE", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });

    let action = "";

    if (existing.length > 0) {
      // They already have an attendance record today
      return NextResponse.json({ error: "Anda sudah melakukan absensi hari ini." }, { status: 400 });
    } else {
      // Create new record (Clock In)
      const id = `ATT-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      // Tentukan branchId yang valid (gunakan branch therapist atau fallback ke cabang pertama yang ada)
      let finalBranchId = therapist.branchId;
      if (!finalBranchId) {
        const fallbackBranch = await db.select({ id: branches.id }).from(branches).limit(1);
        if (fallbackBranch.length > 0) {
          finalBranchId = fallbackBranch[0].id;
        } else {
          finalBranchId = branchId; // Fallback ke yang dikirim client jika database cabang kosong
        }
      }

      await db.insert(attendance).values({
        id,
        therapistId: therapist.id,
        branchId: finalBranchId as string,
        date: dateStr,
        clockIn: currentTime,
        status: currentTime > "09:00" ? "LATE" : "PRESENT",
        photoUrl: photoUrl,
      });
      action = "Clock In";
    }

    return NextResponse.json({
      success: true,
      action,
      therapistName: therapist.name,
      time: currentTime,
      photoUrl
    });

  } catch (error) {
    console.error("POST /api/attendance/kiosk error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem saat memproses absensi.", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
