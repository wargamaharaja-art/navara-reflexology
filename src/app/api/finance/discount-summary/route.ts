import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { type NextRequest } from "next/server";
import { getSession, getActiveBranchFilter } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const branchFilter = await getActiveBranchFilter();
    const branch = branchFilter || searchParams.get("branch");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const conditions = [];

    if (branch && branch !== "ALL") {
      conditions.push(eq(invoices.branchId, branch));
    }
    if (startDate) {
      const startObj = new Date(`${startDate}T00:00:00+07:00`);
      conditions.push(gte(invoices.createdAt, startObj.toISOString()));
    }
    if (endDate) {
      const endObj = new Date(`${endDate}T23:59:59.999+07:00`);
      conditions.push(lte(invoices.createdAt, endObj.toISOString()));
    }

    const allInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        patientName: invoices.patientName,
        branchId: invoices.branchId,
        branchName: invoices.branchName,
        subtotal: invoices.subtotal,
        discount: invoices.discount,
        tax: invoices.tax,
        grandTotal: invoices.grandTotal,
        paymentMethod: invoices.paymentMethod,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(invoices.createdAt));

    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalGrandTotal = 0;
    let discountedInvoicesCount = 0;

    const discountedInvoices = [];

    for (const inv of allInvoices) {
      const subtotal = Number(inv.subtotal) || 0;
      const discount = Number(inv.discount) || 0;
      const tax = Number(inv.tax) || 0;
      const grandTotal = Number(inv.grandTotal) || 0;

      totalSubtotal += subtotal;
      totalDiscount += discount;
      totalTax += tax;
      totalGrandTotal += grandTotal;

      if (discount > 0) {
        discountedInvoicesCount += 1;
        discountedInvoices.push({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          patientName: inv.patientName,
          branchName: inv.branchName,
          subtotal,
          discount,
          grandTotal,
          createdAt: inv.createdAt,
        });
      }
    }

    const totalInvoices = allInvoices.length;
    const discountPercentage = totalSubtotal > 0 ? (totalDiscount / totalSubtotal) * 100 : 0;
    const discountedInvoiceRate = totalInvoices > 0 ? (discountedInvoicesCount / totalInvoices) * 100 : 0;

    return NextResponse.json({
      totalSubtotal,
      totalDiscount,
      totalTax,
      totalGrandTotal,
      totalInvoices,
      discountedInvoicesCount,
      discountPercentage,
      discountedInvoiceRate,
      discountedInvoices: discountedInvoices.slice(0, 50),
    });
  } catch (error) {
    console.error("Failed to fetch discount summary:", error);
    return NextResponse.json({ error: "Failed to fetch discount summary" }, { status: 500 });
  }
}
