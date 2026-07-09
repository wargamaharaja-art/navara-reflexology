"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Filter, RefreshCw, Search } from "lucide-react";
import TherapistCard, { type TherapistAvailability } from "./TherapistCard";

interface TherapistPickerProps {
  branchId: string;
  selectedTherapistId: string;
  onSelect: (therapistId: string) => void;
  pollInterval?: number; // ms, default 5000
}

export default function TherapistPicker({
  branchId,
  selectedTherapistId,
  onSelect,
  pollInterval = 5000,
}: TherapistPickerProps) {
  const [therapistList, setTherapistList] = useState<TherapistAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const fetchAvailability = useCallback(async () => {
    if (!branchId) return;
    try {
      const url = `/api/therapists/availability?branchId=${branchId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTherapistList(data.data || []);
        setLastRefresh(data.serverTime || "");
      }
    } catch (err) {
      console.error("Failed to fetch therapist availability:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchAvailability();
  }, [fetchAvailability]);

  // Polling interval
  useEffect(() => {
    if (!branchId || pollInterval <= 0) return;
    const interval = setInterval(fetchAvailability, pollInterval);
    return () => clearInterval(interval);
  }, [branchId, pollInterval, fetchAvailability]);

  // Also trigger auto-release cron
  useEffect(() => {
    if (!branchId) return;
    const cronInterval = setInterval(async () => {
      try {
        await fetch("/api/cron/release-therapists");
      } catch {}
    }, 60000); // setiap 60 detik
    return () => clearInterval(cronInterval);
  }, [branchId]);

  // Check if selected therapist just became unavailable
  useEffect(() => {
    if (selectedTherapistId) {
      const selected = therapistList.find((t) => t.id === selectedTherapistId);
      if (selected && selected.availabilityStatus !== "AVAILABLE") {
        // Terapis yang dipilih sudah tidak tersedia — notify
        // Don't auto-deselect, just show warning in the card
      }
    }
  }, [therapistList, selectedTherapistId]);

  // Filter logic
  const filtered = therapistList.filter((t) => {
    // Sembunyikan terapis yang statusnya OFF (belum absen/tidak masuk hari ini)
    if (t.availabilityStatus === "OFF" && t.id !== selectedTherapistId) return false;

    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (showAll) return true;
    return t.availabilityStatus === "AVAILABLE" || t.id === selectedTherapistId;
  });

  // Sort: AVAILABLE first, then BUSY, then BREAK, then OFF
  const statusOrder = { AVAILABLE: 0, BUSY: 1, BREAK: 2, OFF: 3 };
  const sorted = [...filtered].sort((a, b) => {
    if (a.id === selectedTherapistId) return -1;
    if (b.id === selectedTherapistId) return 1;
    return statusOrder[a.availabilityStatus] - statusOrder[b.availabilityStatus];
  });

  const statusCounts = {
    AVAILABLE: therapistList.filter((t) => t.availabilityStatus === "AVAILABLE").length,
    BUSY: therapistList.filter((t) => t.availabilityStatus === "BUSY").length,
    BREAK: therapistList.filter((t) => t.availabilityStatus === "BREAK").length,
    OFF: therapistList.filter((t) => t.availabilityStatus === "OFF").length,
  };

  if (!branchId) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        Pilih cabang terlebih dahulu untuk melihat daftar terapis.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with stats */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            🟢 {statusCounts.AVAILABLE}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
            🟡 {statusCounts.BUSY}
          </span>
          {statusCounts.BREAK > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-700 font-bold border border-orange-200">
              🟠 {statusCounts.BREAK}
            </span>
          )}
          {statusCounts.OFF > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
              🔴 {statusCounts.OFF}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="w-3.5 h-3.5 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
            />
            <span className="text-gray-600 font-medium">Tampilkan semua</span>
          </label>
          <button
            type="button"
            onClick={() => { setLoading(true); fetchAvailability(); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      {therapistList.length > 4 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari terapis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
          />
        </div>
      )}

      {/* Grid */}
      {loading && therapistList.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border-2 border-gray-100 p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">
            {showAll ? "Tidak ada terapis di cabang ini." : "Tidak ada terapis tersedia saat ini."}
          </p>
          {!showAll && statusCounts.BUSY > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-semibold underline"
            >
              Tampilkan {statusCounts.BUSY} terapis yang sedang bertugas
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map((t) => (
            <TherapistCard
              key={t.id}
              therapist={t}
              selected={t.id === selectedTherapistId}
              disabled={t.availabilityStatus !== "AVAILABLE" && t.id !== selectedTherapistId}
              onClick={() => {
                if (t.id === selectedTherapistId) {
                  onSelect(""); // Deselect
                } else {
                  onSelect(t.id);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Deselect hint */}
      {selectedTherapistId && (
        <p className="text-[11px] text-gray-400 text-center">
          Klik terapis yang dipilih untuk membatalkan pilihan.
        </p>
      )}
    </div>
  );
}
