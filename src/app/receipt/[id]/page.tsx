"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

type InvoiceItem = {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
};

type InvoiceData = {
  id: string;
  invoiceNumber: string;
  patientName: string;
  patientPhone: string;
  therapistName: string | null;
  branchName: string;
  branchAddress: string | null;
  branchPhone: string | null;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentMethod: string;
  splitPayments: string | null;
  amountPaid: number;
  changeAmount: number;
  notes: string | null;
  createdAt: string;
  branchMapUrl?: string;
  branchWhatsapp?: string;
  feedbackToken?: string;
  feedbackUrl?: string;
};

export default function PublicReceiptPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const receiptRef = useRef<HTMLDivElement>(null);

  const invoiceId = params?.id as string;
  const autoPrint = searchParams?.get("print") === "1";
  const autoWa = searchParams?.get("wa") === "1";

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data.data);
        } else {
          setError("Struk tidak ditemukan");
        }
      } catch {
        setError("Gagal memuat struk");
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) fetchInvoice();
  }, [invoiceId]);

  useEffect(() => {
    if (autoPrint && invoice && !loading) {
      setTimeout(() => window.print(), 500);
    }
  }, [autoPrint, invoice, loading]);

  useEffect(() => {
    if (autoWa && invoice && !loading && receiptRef.current) {
      import("html2canvas-pro").then(({ default: html2canvas }) => {
        setTimeout(() => {
          html2canvas(receiptRef.current!, { scale: 2, useCORS: true }).then(canvas => {
            canvas.toBlob(blob => {
              if (blob) {
                // Download
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `struk-${invoice.patientName.replace(/\s+/g, "-")}.png`;
                a.click();
                URL.revokeObjectURL(url);
                
                // WA Text
                const dateFormatted = new Date(invoice.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
                let itemsText = "";
                invoice.items.forEach(item => {
                  const qtyText = item.qty > 1 ? ` (${item.qty}x)` : "";
                  itemsText += `- ${item.name}${qtyText}\n${formatRupiah(item.subtotal)}\n\n`;
                });
                itemsText = itemsText.trimEnd();
                
                const feedbackLink = invoice.feedbackUrl ? `${window.location.origin}${invoice.feedbackUrl}` : "";
                const feedbackSection = feedbackLink ? `\n\n⭐ *Beri Masukan & Penilaian Layanan:*\n${feedbackLink}` : "";
                
                const msg = `Assalamualaikum ${invoice.patientName} \n\nTerima kasih telah mempercayakan ikhtiar sehatnya di Navara Reflexology Cabang ${invoice.branchName} ✨\n\n📅 Tanggal: ${dateFormatted} \n\n==========================\nDETAIL LAYANAN\n==========================\n${itemsText}\n\nTotal Pembayaran: ${formatRupiah(invoice.grandTotal)}\n==========================\n\n📍 *Lokasi Navara Reflexology:*\n${invoice.branchMapUrl || "[Link Google Maps Klinik belum diatur]"}\n\n📞 *Layanan Pengaduan & Saran:*\n${invoice.branchWhatsapp || "[Nomor WhatsApp Pengaduan belum diatur]"}${feedbackSection}\n\nSemoga lekas sehat dan senantiasa diberi keberkahan. Kami tunggu kunjungan berikutnya! 🙏\n\nSalam sehat,\nTim Navara Reflexology`;
                
                const cleanPhone = invoice.patientPhone.replace(/^0/, "62").replace(/\D/g, "");
                
                try {
                  navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(() => {
                    alert("Gambar struk telah disalin ke Clipboard dan diunduh.\n\nSilakan buka chat WA pasien, lalu tekan Paste (Ctrl+V) untuk mengirim gambar struk.");
                    window.location.replace(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`);
                  }).catch(() => {
                    alert("Gambar struk telah diunduh.\n\nSilakan lampirkan (attach) gambar tersebut di chat WA pasien.");
                    window.location.replace(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`);
                  });
                } catch (e) {
                  alert("Gambar struk telah diunduh.\n\nSilakan lampirkan (attach) gambar tersebut di chat WA pasien.");
                  window.location.replace(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`);
                }
              }
            });
          });
        }, 800); // give time for font rendering
      });
    }
  }, [autoWa, invoice, loading]);

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-6xl mb-4">🧾</p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Struk Tidak Ditemukan</h1>
          <p className="text-gray-500">{error || "Link struk mungkin sudah tidak valid."}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print-optimized CSS */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-receipt {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
          .print-receipt * {
            color: black !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
          }
          .print-receipt h1 {
            font-size: 16px !important;
          }
          .print-receipt .receipt-total {
            font-size: 14px !important;
          }
          .print-receipt .receipt-brand {
            font-size: 14px !important;
          }
        }
        
        @media screen {
          .receipt-screen-bg {
            background: linear-gradient(135deg, #065f46 0%, #064e3b 50%, #022c22 100%);
            min-height: 100vh;
          }
        }
      `}</style>

      <div className="receipt-screen-bg min-h-screen flex flex-col items-center justify-start py-6 px-4">
        {/* Screen Header - hidden in print */}
        <div className="no-print text-center mb-6 max-w-md w-full">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            <span className="text-white">Navara</span>{" "}
            <span className="text-emerald-300">Reflexology</span>
          </h1>
          <p className="text-emerald-300/70 text-sm mt-1">Struk Digital</p>
        </div>

        {/* Receipt Card */}
        <div ref={receiptRef} className="print-receipt bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Brand Header */}
          <div className="text-center py-6 px-6 border-b-2 border-dashed border-gray-200">
            <h1 className="receipt-brand text-2xl font-extrabold text-gray-900 tracking-tight">
              NAVARA REFLEXOLOGY
            </h1>
            <p className="text-emerald-600 font-semibold text-sm mt-1">Solusi Teman Sehatku</p>
            <div className="mt-3 text-xs text-gray-500 space-y-0.5">
              <p className="font-semibold text-gray-700">{invoice.branchName}</p>
              {invoice.branchAddress && <p>{invoice.branchAddress}</p>}
              {invoice.branchPhone && <p>Telp: {invoice.branchPhone}</p>}
            </div>
          </div>

          {/* Invoice Info */}
          <div className="px-6 py-4 border-b border-dashed border-gray-200 text-xs">
            <div className="grid grid-cols-2 gap-y-1.5">
              <div>
                <span className="text-gray-400">No. Invoice</span>
                <p className="font-bold text-gray-800 font-mono">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-400">Tanggal</span>
                <p className="font-semibold text-gray-700">{formatDate(invoice.createdAt)}</p>
              </div>
              <div>
                <span className="text-gray-400">Waktu</span>
                <p className="font-semibold text-gray-700">{formatTime(invoice.createdAt)} WIB</p>
              </div>
              <div className="text-right">
                <span className="text-gray-400">Pembayaran</span>
                <p className="font-semibold text-gray-700">{invoice.paymentMethod === "SPLIT" ? "Ganda (Split)" : invoice.paymentMethod}</p>
              </div>
            </div>
          </div>

          {/* Patient & Therapist */}
          <div className="px-6 py-3 border-b border-dashed border-gray-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Pasien</span>
              <span className="font-semibold text-gray-800">{invoice.patientName}</span>
            </div>
            {invoice.therapistName && (
              <div className="flex justify-between">
                <span className="text-gray-400">Terapis</span>
                <span className="font-semibold text-gray-800">{invoice.therapistName}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="px-6 py-4 border-b border-dashed border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left py-2 font-semibold">Item</th>
                  <th className="text-center py-2 font-semibold w-10">Qty</th>
                  <th className="text-right py-2 font-semibold">Harga</th>
                  <th className="text-right py-2 font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-2 text-gray-800 font-medium">{item.name}</td>
                    <td className="py-2 text-center text-gray-600">{item.qty}</td>
                    <td className="py-2 text-right text-gray-600">{formatRupiah(item.price)}</td>
                    <td className="py-2 text-right font-semibold text-gray-800">{formatRupiah(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-6 py-4 border-b border-dashed border-gray-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-800">{formatRupiah(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Diskon</span>
                <span className="font-semibold">- {formatRupiah(invoice.discount)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Pajak{invoice.subtotal > 0 ? ` (${Math.round(invoice.tax / invoice.subtotal * 100)}%)` : ''}</span>
                <span className="font-semibold text-gray-800">{formatRupiah(invoice.tax)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-extrabold text-gray-900">TOTAL</span>
              <span className="receipt-total text-lg font-extrabold text-emerald-600">{formatRupiah(invoice.grandTotal)}</span>
            </div>
            {invoice.paymentMethod === "SPLIT" && invoice.splitPayments ? (
              JSON.parse(invoice.splitPayments).map((sp: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-gray-500">Bayar ({sp.method})</span>
                  <span className="font-semibold text-gray-800">{formatRupiah(sp.amount)}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-500">Bayar ({invoice.paymentMethod})</span>
                <span className="font-semibold text-gray-800">{formatRupiah(invoice.amountPaid)}</span>
              </div>
            )}
            {invoice.changeAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Kembalian</span>
                <span className="font-bold text-gray-900">{formatRupiah(invoice.changeAmount)}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="px-6 py-3 border-b border-dashed border-gray-200 text-xs">
              <span className="text-gray-400">Catatan:</span>
              <p className="text-gray-700 mt-0.5">{invoice.notes}</p>
            </div>
          )}

          {/* Customer Feedback QR Code Section */}
          {invoice.feedbackUrl && (
            <div className="px-6 py-4 border-b border-dashed border-gray-200 text-center bg-emerald-50/40">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                ⭐ Penilaian & Masukan Pelanggan
              </span>
              <p className="text-[10px] text-gray-500 mt-0.5 mb-2.5">
                Scan QR Code di bawah untuk memberikan rating layanan kami:
              </p>
              <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-emerald-200/60 mb-2">
                <QRCodeSVG
                  value={typeof window !== "undefined" ? `${window.location.origin}${invoice.feedbackUrl}` : `https://navara.id${invoice.feedbackUrl}`}
                  size={90}
                />
              </div>
              <div className="no-print">
                <a
                  href={invoice.feedbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Buka Form Feedback Online →
                </a>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-6 px-6">
            <p className="text-xs text-gray-500 leading-relaxed">
              Terima kasih telah mempercayakan<br />
              ikhtiar sehatnya di <strong className="text-gray-700">Navara Reflexology</strong>
            </p>
            <p className="text-[10px] text-gray-400 mt-3">
              Semoga lekas sehat dan senantiasa<br />
              diberi keberkahan 🙏
            </p>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-300 font-mono">{invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>

        {/* Screen Actions - hidden in print */}
        <div className="no-print mt-6 max-w-md w-full space-y-3">
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3.5 rounded-xl font-semibold backdrop-blur-sm border border-white/10 transition-colors"
          >
            🖨️ Cetak Struk
          </button>
          <div className="text-center">
            <a
              href="/"
              className="text-emerald-300/70 hover:text-emerald-200 text-sm font-medium transition-colors"
            >
              ← Kembali ke Beranda
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
