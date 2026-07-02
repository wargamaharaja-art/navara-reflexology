export type ServiceKey =
  | "bekam-holistik"
  | "bekam-tradisional"
  | "bekam-estetika"
  | "bekam-kepala"
  | "refleksi-full-body-double"
  | "totok-wajah"
  | "tambahan-infrared"
  | "paket-refleksi-totok"
  | "paket-bekam-holistik-refleksi"
  | "paket-bekam-refleksi-totok"
  | "paket-bekam-kepala-refleksi"
  | "cek-asam-urat"
  | "cek-gula-darah"
  | "cek-kolesterol"
  | "paket-lengkap-mcu"
  | "paket-bekam-refleksi-infrared";

export interface ServiceDetail {
  id: ServiceKey;
  name: string;
  category: "TREATMENT" | "PAKET" | "MCU";
}

export const SERVICES_LIST: ServiceDetail[] = [
  { id: "bekam-holistik", name: "Bekam Holistik", category: "TREATMENT" },
  { id: "bekam-tradisional", name: "Bekam Tradisional", category: "TREATMENT" },
  { id: "bekam-estetika", name: "Bekam Estetika", category: "TREATMENT" },
  { id: "bekam-kepala", name: "Bekam Kepala (Tanpa Cukur)", category: "TREATMENT" },
  { id: "refleksi-full-body-double", name: "Refleksi Full Body (Double)", category: "TREATMENT" },
  { id: "totok-wajah", name: "Totok Wajah", category: "TREATMENT" },
  { id: "tambahan-infrared", name: "Tambahan Infra red", category: "TREATMENT" },
  { id: "paket-refleksi-totok", name: "Refleksi Full Body + Totok Wajah", category: "PAKET" },
  { id: "paket-bekam-holistik-refleksi", name: "Bekam Holistik + Refleksi Full Body", category: "PAKET" },
  { id: "paket-bekam-refleksi-totok", name: "Bekam + Refleksi Full Body + Totok Wajah", category: "PAKET" },
  { id: "paket-bekam-kepala-refleksi", name: "Bekam + Bekam Kepala + Refleksi Full Body", category: "PAKET" },
  { id: "paket-bekam-refleksi-infrared", name: "Bekam + Refleksi Full Body + Infra Red", category: "PAKET" },
  { id: "cek-asam-urat", name: "Cek Asam Urat", category: "MCU" },
  { id: "cek-gula-darah", name: "Cek Gula Darah", category: "MCU" },
  { id: "cek-kolesterol", name: "Cek Kolesterol", category: "MCU" },
  { id: "paket-lengkap-mcu", name: "Paket Lengkap MCU", category: "MCU" },
];

type PricingMatrix = Record<string, Record<string, number>>;

// Matrix Harga Berdasarkan Cabang -> Layanan
export const PRICING_MATRIX: PricingMatrix = {
  "mustika-jaya": {
    "bekam-holistik": 99000,
    "bekam-tradisional": 55000,
    "bekam-estetika": 50000,
    "bekam-kepala": 50000,
    "refleksi-full-body-double": 139000,
    "totok-wajah": 30000,
    "tambahan-infrared": 20000,
    "paket-refleksi-totok": 100000,
    "paket-bekam-holistik-refleksi": 164000,
    "paket-bekam-refleksi-totok": 160000,
    "paket-bekam-kepala-refleksi": 175000,
    "cek-asam-urat": 15000,
    "cek-gula-darah": 15000,
    "cek-kolesterol": 30000,
    "paket-lengkap-mcu": 55000,
  },
  "karawaci": {
    "bekam-holistik": 99000,
    "bekam-tradisional": 55000,
    "bekam-estetika": 50000,
    "bekam-kepala": 50000,
    "refleksi-full-body-double": 149000,
    "totok-wajah": 30000,
    "tambahan-infrared": 20000,
    "paket-refleksi-totok": 100000,
    "paket-bekam-holistik-refleksi": 169000,
    "paket-bekam-refleksi-totok": 170000,
    "paket-bekam-kepala-refleksi": 190000,
    "cek-asam-urat": 15000,
    "cek-gula-darah": 15000,
    "cek-kolesterol": 30000,
    "paket-lengkap-mcu": 55000,
  },
  "karangsatria": {
    "bekam-holistik": 99000,
    "bekam-tradisional": 55000,
    "bekam-estetika": 50000,
    "bekam-kepala": 50000,
    "refleksi-full-body-double": 149000,
    "totok-wajah": 30000,
    "tambahan-infrared": 20000,
    "paket-refleksi-totok": 100000, // asumsikan sama
    "paket-bekam-holistik-refleksi": 169000,
    "paket-bekam-refleksi-totok": 160000, // Bekam + Refleksi Full Body + Totok Wajah
    "paket-bekam-kepala-refleksi": 180000, // diasumsikan 180k dari pola (Bekam+Refleksi+Infrared = 150k)
    "paket-bekam-refleksi-infrared": 150000,
    "cek-asam-urat": 15000,
    "cek-gula-darah": 15000,
    "cek-kolesterol": 30000,
    "paket-lengkap-mcu": 55000,
  },
  "jatibening": {
    "bekam-holistik": 99000,
    "bekam-tradisional": 55000,
    "bekam-estetika": 50000,
    "bekam-kepala": 50000,
    "refleksi-full-body-double": 149000,
    "totok-wajah": 30000,
    "tambahan-infrared": 20000,
    "paket-refleksi-totok": 105000, // asumsikan harga paket duren sawit/karawaci
    "paket-bekam-holistik-refleksi": 169000,
    "paket-bekam-refleksi-totok": 170000,
    "paket-bekam-kepala-refleksi": 185000,
    "cek-asam-urat": 15000,
    "cek-gula-darah": 15000,
    "cek-kolesterol": 30000,
    "paket-lengkap-mcu": 55000,
  },
  "duren-sawit": {
    "bekam-holistik": 99000,
    "bekam-tradisional": 55000,
    "bekam-estetika": 50000,
    "bekam-kepala": 50000,
    "refleksi-full-body-double": 149000,
    "totok-wajah": 30000,
    "tambahan-infrared": 20000,
    "paket-refleksi-totok": 105000,
    "paket-bekam-holistik-refleksi": 169000,
    "paket-bekam-refleksi-totok": 170000,
    "paket-bekam-kepala-refleksi": 185000,
    "cek-asam-urat": 15000,
    "cek-gula-darah": 15000,
    "cek-kolesterol": 30000,
    "paket-lengkap-mcu": 55000,
  },
  "harapan-indah": {
    "bekam-holistik": 99000,
    "bekam-tradisional": 55000,
    "bekam-estetika": 50000,
    "bekam-kepala": 50000,
    "refleksi-full-body-double": 149000,
    "totok-wajah": 30000,
    "tambahan-infrared": 20000,
    "paket-refleksi-totok": 105000,
    "paket-bekam-holistik-refleksi": 169000,
    "paket-bekam-refleksi-totok": 170000,
    "paket-bekam-kepala-refleksi": 185000,
    "cek-asam-urat": 15000,
    "cek-gula-darah": 15000,
    "cek-kolesterol": 30000,
    "paket-lengkap-mcu": 55000,
  }
};

/**
 * Helper untuk mendapatkan harga layanan di cabang tertentu.
 * Jika cabang tidak ditemukan, menggunakan harga rata-rata/umum (Karawaci).
 */
export function getServicePrice(branchId: string, serviceId: string): number {
  const branchPricing = PRICING_MATRIX[branchId] || PRICING_MATRIX["karawaci"];
  return branchPricing[serviceId] || 0;
}
