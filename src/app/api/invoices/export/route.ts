import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq, and, like, gte, lte } from "drizzle-orm";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

// GET: Export invoices as CSV for a given date range
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date"); // YYYY-MM-DD
    const branchFilter = await getActiveBranchFilter();

    const conditions = [];
    if (branchFilter) {
      conditions.push(eq(invoices.branchId, branchFilter));
    }
    if (dateParam) {
      conditions.push(like(invoices.createdAt, `${dateParam}%`));
    }

    const result = await db
      .select()
      .from(invoices)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(invoices.createdAt);

    // Build CSV
    const headers = [
      "No. Invoice",
      "Tanggal",
      "Cabang",
      "Pasien",
      "No. Telepon",
      "Terapis",
      "Item Layanan",
      "Subtotal",
      "Diskon",
      "Pajak",
      "Grand Total",
      "Metode Bayar",
      "Uang Diterima",
      "Kembalian",
      "Catatan",
    ];

    const rows = result.map((inv) => {
      let itemsSummary = "";
      try {
        const parsedItems = JSON.parse(inv.items);
        itemsSummary = parsedItems.map((i: any) => `${i.name} x${i.qty}`).join("; ");
      } catch {
        itemsSummary = inv.items;
      }

      const createdDate = new Date(inv.createdAt);
      const dateFormatted = createdDate.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      });
      const timeFormatted = createdDate.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      });

      return [
        inv.invoiceNumber,
        `${dateFormatted} ${timeFormatted}`,
        inv.branchName,
        inv.patientName,
        inv.patientPhone,
        inv.therapistName || "-",
        `"${itemsSummary}"`,
        inv.subtotal,
        inv.discount,
        inv.tax,
        inv.grandTotal,
        inv.paymentMethod,
        inv.amountPaid,
        inv.changeAmount,
        `"${inv.notes || ""}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility

    return new Response(bom + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="struk_${dateParam || "all"}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/invoices/export error:", error);
    return NextResponse.json({ error: "Gagal export data" }, { status: 500 });
  }
}
