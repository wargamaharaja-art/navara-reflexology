"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";

type MutationDetail = {
  id: string;
  mutationNumber: string;
  therapistId: string;
  fromBranchId: string | null;
  toBranchId: string;
  effectiveDate: string;
  reason: string;
  notes: string | null;
  status: "DRAFT" | "APPROVED" | "REJECTED" | "CANCELLED" | "EXECUTED" | "REVERSED";
  requestedBy: string;
  requestedByName: string;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  executedAt: string | null;
  rejectedReason: string | null;
  reversedBy: string | null;
  reversedByName: string | null;
  reversedAt: string | null;
  reversedReason: string | null;
  createdAt: string;
  updatedAt: string;
  therapist: {
    id: string;
    name: string;
    specialization: string;
    phone: string;
    gender: string;
    photoUrl: string | null;
  } | null;
  fromBranch: {
    id: string;
    name: string;
    address: string;
    phone: string;
  } | null;
  toBranch: {
    id: string;
    name: string;
    address: string;
    phone: string;
  } | null;
  company: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
  } | null;
};

export default function PublicMutationLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<MutationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resDetail = await fetch(`/api/therapist-mutations/${id}`);
        if (resDetail.ok) {
          const d = await resDetail.json();
          setData(d.data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <p className="text-gray-500 text-lg">Surat mutasi tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
      {/* Screen Action - Hidden in print */}
      <div className="print:hidden w-full max-w-3xl flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Surat Mutasi Terapis</h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-md"
        >
          <Printer className="w-4 h-4" /> Cetak Surat
        </button>
      </div>

      {/* Print View container */}
      <div className="w-full max-w-3xl bg-white shadow-xl print:shadow-none p-8 md:p-12 text-black" style={{ fontFamily: "'Times New Roman', serif" }}>
        {/* Letter Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide">{data.company?.companyName || "Radja Bekam Reflexology"}</h1>
          <p className="text-sm mt-1">{data.company?.address || ""}</p>
          <p className="text-sm">Telp: {data.company?.phone || ""} | Email: {data.company?.email || ""}</p>
        </div>

        {/* Letter Title */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-bold underline uppercase">Surat Mutasi</h2>
          <p className="text-sm mt-1">Nomor: {data.mutationNumber}</p>
        </div>

        {/* Letter Body */}
        <div className="space-y-4 text-sm leading-relaxed">
          <p>Yang bertanda tangan di bawah ini, manajemen <strong>{data.company?.companyName || "Radja Bekam Reflexology"}</strong>, dengan ini menyatakan bahwa:</p>

          <table className="ml-8 text-sm">
            <tbody>
              <tr>
                <td className="pr-4 py-1 align-top">Nama</td>
                <td className="pr-2 py-1 align-top">:</td>
                <td className="py-1 font-semibold">{data.therapist?.name || "—"}</td>
              </tr>
              <tr>
                <td className="pr-4 py-1 align-top">Spesialisasi</td>
                <td className="pr-2 py-1 align-top">:</td>
                <td className="py-1">{data.therapist?.specialization || "—"}</td>
              </tr>
              <tr>
                <td className="pr-4 py-1 align-top">No. Telepon</td>
                <td className="pr-2 py-1 align-top">:</td>
                <td className="py-1">{data.therapist?.phone || "—"}</td>
              </tr>
            </tbody>
          </table>

          <p>
            Terhitung mulai tanggal <strong>{formatDate(data.effectiveDate)}</strong>, yang bersangkutan 
            dimutasikan dari <strong>{data.fromBranch?.name || "—"}</strong> ({data.fromBranch?.address || "—"}) ke <strong>{data.toBranch?.name || "—"}</strong> ({data.toBranch?.address || "—"}).
          </p>

          <p>Adapun alasan mutasi ini adalah: {data.reason}</p>

          {data.notes && <p>Catatan tambahan: {data.notes}</p>}

          <p>
            Demikian surat mutasi ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
          </p>
        </div>

        {/* Signatures */}
        <div className="flex justify-between mt-16">
          <div className="text-center text-sm">
            <p>Diajukan oleh,</p>
            <div className="h-20" />
            <p className="font-bold underline">{data.requestedByName}</p>
            <p>Pengaju</p>
          </div>
          {data.approvedByName && (
            <div className="text-center text-sm">
              <p>Disetujui oleh,</p>
              <div className="h-20" />
              <p className="font-bold underline">{data.approvedByName}</p>
              <p>Penyetuju</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-4 border-t border-gray-400 text-xs text-gray-500 text-center">
          <p>Dokumen ini dicetak secara otomatis oleh sistem {data.company?.companyName || "Radja Bekam Reflexology"}</p>
          <p>Dicetak pada: {new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
