"use client";

import { UserCheck, Clock, Activity, Coffee, XCircle } from "lucide-react";

export type TherapistAvailability = {
  id: string;
  name: string;
  specialization: string;
  gender: string;
  photoUrl: string | null;
  branchId: string | null;
  availabilityStatus: "AVAILABLE" | "BUSY" | "BREAK" | "OFF";
  patientsToday: number;
  estimatedFinish: string | null;
  currentServiceName: string | null;
  clockIn: string | null;
  clockOut: string | null;
};

const statusConfig = {
  AVAILABLE: {
    label: "Tersedia",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    ring: "ring-emerald-500/20",
    dot: "bg-emerald-500",
    icon: UserCheck,
  },
  BUSY: {
    label: "Bertugas",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    ring: "ring-amber-500/20",
    dot: "bg-amber-500",
    icon: Activity,
  },
  BREAK: {
    label: "Istirahat",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    ring: "ring-orange-500/20",
    dot: "bg-orange-500",
    icon: Coffee,
  },
  OFF: {
    label: "Tidak Masuk",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    ring: "ring-red-500/20",
    dot: "bg-red-500",
    icon: XCircle,
  },
};

interface TherapistCardProps {
  therapist: TherapistAvailability;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}

export default function TherapistCard({ therapist, selected, disabled, onClick }: TherapistCardProps) {
  const config = statusConfig[therapist.availabilityStatus];
  const StatusIcon = config.icon;
  const initials = therapist.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isClickable = !disabled && therapist.availabilityStatus === "AVAILABLE";

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        relative rounded-2xl border-2 p-4 transition-all duration-300 group
        ${selected
          ? "border-teal-500 bg-teal-50/80 shadow-lg shadow-teal-500/10 ring-4 ring-teal-500/20 scale-[1.02]"
          : isClickable
            ? `border-gray-200 bg-white hover:border-teal-300 hover:shadow-md hover:scale-[1.01] cursor-pointer`
            : `border-gray-100 bg-gray-50/50 opacity-60 cursor-not-allowed`
        }
      `}
    >
      {/* Status Badge */}
      <div className={`absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color} ${config.border} border flex items-center gap-1`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${therapist.availabilityStatus === "AVAILABLE" ? "animate-pulse" : ""}`} />
        {config.label}
      </div>

      {/* Selection Check */}
      {selected && (
        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center shadow-md animate-in zoom-in duration-200">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-colors ${
          selected 
            ? "bg-teal-600 text-white" 
            : therapist.gender === "L" 
              ? "bg-blue-100 text-blue-700" 
              : "bg-pink-100 text-pink-700"
        }`}>
          {therapist.photoUrl ? (
            <img src={therapist.photoUrl} alt={therapist.name} className="w-full h-full rounded-xl object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm truncate ${selected ? "text-teal-900" : "text-gray-900"}`}>
            {therapist.name}
          </p>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {therapist.specialization}
          </p>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mt-2 text-[11px]">
            <span className="flex items-center gap-1 text-gray-500">
              <UserCheck className="w-3 h-3" />
              {therapist.patientsToday} pasien
            </span>
            {therapist.clockIn && (
              <span className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3 h-3" />
                {therapist.clockIn}
              </span>
            )}
          </div>

          {/* Active Service Info (when BUSY) */}
          {therapist.availabilityStatus === "BUSY" && therapist.currentServiceName && (
            <div className="mt-2 px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Sedang Menangani</p>
              <p className="text-xs font-bold text-amber-900 truncate">{therapist.currentServiceName}</p>
              {therapist.estimatedFinish && (
                <p className="text-[10px] text-amber-600 mt-0.5">
                  Estimasi selesai: <span className="font-bold">{therapist.estimatedFinish}</span>
                </p>
              )}
            </div>
          )}

          {/* Break Info */}
          {therapist.availabilityStatus === "BREAK" && (
            <div className="mt-2 px-2 py-1.5 rounded-lg bg-orange-50 border border-orange-100">
              <p className="text-[10px] font-semibold text-orange-700">🟠 Sedang istirahat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
