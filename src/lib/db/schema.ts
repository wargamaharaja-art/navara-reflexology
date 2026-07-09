import { pgTable, text, integer, boolean, json, index } from "drizzle-orm/pg-core";

// ============================================
// BRANCHES (Cabang Klinik)
// ============================================
export const branches = pgTable("branches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  operatingHours: text("operating_hours").notNull().default("09:00 - 21:00 WIB"),
  operatingHoursWeekend: text("operating_hours_weekend").notNull().default("09:00 - 21:00 WIB"),
  mapUrl: text("map_url"),
  isActive: boolean("is_active").notNull().default(true),
});

// ============================================
// SERVICES (Layanan Terapi)
// ============================================
export const services = pgTable("services", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  category: text("category", { enum: ["Paket Treatment", "Full Body Massages", "Refleksi", "Bekam", "Adds On"] }).notNull().default("Paket Treatment"),
  isActive: boolean("is_active").notNull().default(true),
});

// ============================================
// THERAPISTS (Data Pegawai Terapis)
// ============================================
export const therapists = pgTable("therapists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  specialization: text("specialization").notNull(), // e.g., "Bekam Kering", "Bekam Basah", "Akupuntur"
  phone: text("phone").notNull(),
  gender: text("gender", { enum: ["L", "P"] }).notNull(), // L: Laki-laki, P: Perempuan
  baseSalary: integer("base_salary").notNull().default(0),
  commissionRate: integer("commission_rate").notNull().default(0),
  branchId: text("branch_id").references(() => branches.id),
  photoUrl: text("photo_url"), // URL or base64 data for ID card photo
  birthDate: text("birth_date"),
  pinCode: text("pin_code"),
  contractStartDate: text("contract_start_date"),
  contractEndDate: text("contract_end_date"),
  availabilityStatus: text("availability_status", { enum: ["AVAILABLE", "BUSY", "BREAK", "OFF"] }).notNull().default("AVAILABLE"),
  isActive: boolean("is_active").notNull().default(true),
  joinedAt: text("joined_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  branchIdx: index("therapist_branch_idx").on(table.branchId),
}));

// ============================================
// INVENTORY (Master Barang Gudang)
// ============================================
export const inventoryItems = pgTable("inventory_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // e.g., "Alat Medis", "Herbal & Obat", "Perlengkapan Umum"
  unit: text("unit").notNull(), // e.g., "Pcs", "Box", "Botol"
  currentStock: integer("current_stock").notNull().default(0),
  minStockAlert: integer("min_stock_alert").notNull().default(5),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ============================================
// INVENTORY TRANSACTIONS (Riwayat Keluar/Masuk Barang)
// ============================================
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: text("id").primaryKey(),
  itemId: text("item_id").notNull().references(() => inventoryItems.id),
  type: text("type", { enum: ["IN", "OUT"] }).notNull(), // IN: Masuk/Beli, OUT: Keluar/Pakai
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  branchId: text("branch_id").references(() => branches.id),
  date: text("date").notNull().$defaultFn(() => new Date().toISOString()),
});

// ============================================
// FINANCE CATEGORIES (Master Data Kategori Finansial)
// ============================================
export const financeCategories = pgTable("finance_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["INCOME", "EXPENSE"] }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// ============================================
// FINANCE TRANSACTIONS (Buku Kas & Laba Rugi)
// ============================================
export const financeTransactions = pgTable("finance_transactions", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["INCOME", "EXPENSE"] }).notNull(),
  category: text("category").notNull(), // e.g., "Reservasi", "Gaji Terapis", "Operasional", "Pembelian Stok"
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  referenceId: text("reference_id"), // Optional: ID from reservations or inventory
  branchId: text("branch_id").references(() => branches.id),
  paymentMethod: text("payment_method").notNull().default("CASH"), // e.g., "CASH", "TRANSFER", "EWALLET"
  attachmentUrl: text("attachment_url"), // URL/Link bukti transaksi
  date: text("date").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  branchIdx: index("finance_branch_idx").on(table.branchId),
  dateIdx: index("finance_date_idx").on(table.date),
}));

// ============================================
// PATIENTS (Buku Pasien)
// ============================================
export const patients = pgTable("patients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  gender: text("gender", { enum: ["L", "P"] }),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ============================================
// PATIENT VISITS (Kunjungan Pasien)
// ============================================
export const patientVisits = pgTable("patient_visits", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  serviceId: text("service_id").notNull().references(() => services.id),
  branchId: text("branch_id").notNull().references(() => branches.id),
  therapistId: text("therapist_id").references(() => therapists.id),
  visitDate: text("visit_date").notNull(),
  visitTime: text("visit_time").notNull(),
  checkInTime: text("check_in_time"), // HH:mm — jam mulai terapi
  checkOutTime: text("check_out_time"), // HH:mm — jam selesai terhitung/manual
  actualCheckOutTime: text("actual_check_out_time"), // HH:mm — jam selesai aktual (auto-release)
  therapistStatusSnapshot: text("therapist_status_snapshot"), // Status terapis saat kunjungan dibuat
  bloodPressure: text("blood_pressure"),
  notes: text("notes"),
  status: text("status", { enum: ["completed", "cancelled", "in_progress"] }).notNull().default("completed"),
  paymentStatus: text("payment_status", { enum: ["UNPAID", "PAID"] }).notNull().default("UNPAID"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  branchIdx: index("visit_branch_idx").on(table.branchId),
  dateIdx: index("visit_date_idx").on(table.visitDate),
  therapistIdx: index("visit_therapist_idx").on(table.therapistId),
}));

// ============================================
// RESERVATIONS (Pemesanan via Web)
// ============================================
export const reservations = pgTable("reservations", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  branchId: text("branch_id").notNull().references(() => branches.id),
  serviceId: text("service_id").notNull().references(() => services.id),
  date: text("date").notNull(),
  time: text("time").notNull(),
  notes: text("notes"),
  status: text("status", { enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] }).notNull().default("PENDING"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  branchIdx: index("reservation_branch_idx").on(table.branchId),
  dateIdx: index("reservation_date_idx").on(table.date),
}));

// ============================================
// SETTINGS (Informasi Perusahaan Global)
// ============================================
export const settings = pgTable("settings", {
  id: text("id").primaryKey(), // We'll just use one row with id "company_info"
  companyName: text("company_name").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  heroBadgeText: text("hero_badge_text").notNull().default("TERPERCAYA & PROFESIONAL"),
  heroTitle: text("hero_title").notNull().default("Solusi Teman Sehatku"),
  heroDescription: text("hero_description").notNull().default("Menghadirkan layanan pengobatan sunnah berkualitas tinggi dengan standar medis modern. Temukan ketenangan dan kesembuhan alami di tangan terapis ahli kami."),
  operatingHours: text("operating_hours").notNull().default("09:00 - 21:00 WIB"),
  operatingHoursWeekend: text("operating_hours_weekend").notNull().default("09:00 - 21:00 WIB"),
  mapUrl: text("map_url"),
  aboutPageContent: json("about_page_content"),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ============================================
// THERAPIST COMMISSIONS (Komisi Terapis)
// ============================================
export const therapistCommissions = pgTable("therapist_commissions", {
  id: text("id").primaryKey(),
  therapistId: text("therapist_id").notNull().references(() => therapists.id),
  visitId: text("visit_id").notNull().references(() => patientVisits.id),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["PENDING", "PAID"] }).notNull().default("PENDING"),
  paidAt: text("paid_at"), // When status becomes PAID
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  therapistIdx: index("commission_therapist_idx").on(table.therapistId),
  visitIdx: index("commission_visit_idx").on(table.visitId),
}));

// ============================================
// MONTHLY TARGETS (KPI Bulanan)
// ============================================
export const monthlyTargets = pgTable("monthly_targets", {
  id: text("id").primaryKey(), // "${branchId}-${month}"
  month: text("month").notNull(), // "YYYY-MM"
  branchId: text("branch_id").notNull().references(() => branches.id),
  targetIncome: integer("target_income").notNull().default(0),
  targetVisits: integer("target_visits").notNull().default(0),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ============================================
// ADMINS (Pengguna Panel Admin)
// ============================================
export const admins = pgTable("admins", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["SUPER_ADMIN", "BRANCH_ADMIN", "THERAPIST", "CASHIER", "INVESTOR"] }).notNull().default("BRANCH_ADMIN"),
  permissions: text("permissions"), // JSON string array of allowed menus
  branchId: text("branch_id").references(() => branches.id), // Nullable for SUPER_ADMIN or INVESTOR
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ============================================
// Type Exports
// ============================================
export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Therapist = typeof therapists.$inferSelect;
export type NewTherapist = typeof therapists.$inferInsert;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type NewInventoryTransaction = typeof inventoryTransactions.$inferInsert;

export type FinanceTransaction = typeof financeTransactions.$inferSelect;
export type NewFinanceTransaction = typeof financeTransactions.$inferInsert;

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

export type PatientVisit = typeof patientVisits.$inferSelect;
export type NewPatientVisit = typeof patientVisits.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;

export type TherapistCommission = typeof therapistCommissions.$inferSelect;
export type NewTherapistCommission = typeof therapistCommissions.$inferInsert;

export type FinanceCategory = typeof financeCategories.$inferSelect;
export type NewFinanceCategory = typeof financeCategories.$inferInsert;

export type MonthlyTarget = typeof monthlyTargets.$inferSelect;
export type NewMonthlyTarget = typeof monthlyTargets.$inferInsert;

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

// ============================================
// ACCOUNTING (Double-Entry System)
// ============================================

// Chart of Accounts (Buku Besar)
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g., "101" (Kas), "401" (Pendapatan), dll
  name: text("name").notNull(),
  type: text("type", { enum: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "COGS", "EXPENSE"] }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Journal Entries (Jurnal Umum Header)
export const journalEntries = pgTable("journal_entries", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  description: text("description").notNull(),
  referenceId: text("reference_id"), // Referensi ke financeTransactions atau resi lainnya
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Journal Lines (Detail Debet/Kredit Jurnal)
export const journalLines = pgTable("journal_lines", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull().references(() => accounts.id),
  debit: integer("debit").notNull().default(0),
  credit: integer("credit").notNull().default(0),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;

export type JournalLine = typeof journalLines.$inferSelect;
export type NewJournalLine = typeof journalLines.$inferInsert;

// ============================================
// ATTENDANCE (Absensi Karyawan)
// ============================================
export const attendance = pgTable("attendance", {
  id: text("id").primaryKey(),
  therapistId: text("therapist_id").notNull().references(() => therapists.id),
  branchId: text("branch_id").notNull().references(() => branches.id),
  date: text("date").notNull(), // YYYY-MM-DD
  clockIn: text("clock_in"), // HH:MM
  clockOut: text("clock_out"), // HH:MM
  status: text("status", { enum: ["PRESENT", "LATE", "ABSENT"] }).notNull().default("PRESENT"),
  notes: text("notes"),
  photoUrl: text("photo_url"),
}, (table) => ({
  branchIdx: index("attendance_branch_idx").on(table.branchId),
  therapistIdx: index("attendance_therapist_idx").on(table.therapistId),
  dateIdx: index("attendance_date_idx").on(table.date),
}));

// ============================================
// THERAPIST SERVICE COMMISSIONS (Override Komisi)
// ============================================
export const therapistServiceCommissions = pgTable("therapist_service_commissions", {
  id: text("id").primaryKey(),
  therapistId: text("therapist_id").notNull().references(() => therapists.id),
  serviceId: text("service_id").notNull().references(() => services.id),
  commissionAmount: integer("commission_amount").notNull(),
});

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;

export type TherapistServiceCommission = typeof therapistServiceCommissions.$inferSelect;
export type NewTherapistServiceCommission = typeof therapistServiceCommissions.$inferInsert;

// ============================================
// THERAPIST MONTHLY REPORTS (Rapor & Slip Gaji)
// ============================================
export const therapistMonthlyReports = pgTable("therapist_monthly_reports", {
  id: text("id").primaryKey(), // Secure UUID / Token unik
  therapistId: text("therapist_id").notNull().references(() => therapists.id, { onDelete: "cascade" }),
  month: text("month"), // Format YYYY-MM (misal "2026-06") - opsional jika pakai rentang tanggal
  startDate: text("start_date"), // YYYY-MM-DD
  endDate: text("end_date"), // YYYY-MM-DD
  totalTreatments: integer("total_treatments").notNull().default(0),
  attendancePresent: integer("attendance_present").notNull().default(0),
  attendanceLate: integer("attendance_late").notNull().default(0),
  attendanceAbsent: integer("attendance_absent").notNull().default(0),
  attendancePermit: integer("attendance_permit").notNull().default(0), // Sakit/Izin
  baseSalary: integer("base_salary").notNull().default(0),
  commissions: integer("commissions").notNull().default(0),
  allowances: integer("allowances").notNull().default(0), // Uang makan/transport
  bonuses: integer("bonuses").notNull().default(0),
  deductions: integer("deductions").notNull().default(0), // Kasbon, penalti denda
  takeHomePay: integer("take_home_pay").notNull().default(0),
  notesStrengths: text("notes_strengths"), // Kelebihan bulan ini
  notesImprovements: text("notes_improvements"), // Area perbaikan
  notesTargets: text("notes_targets"), // Target bulan depan
  rating: text("rating"), // Rating rata-rata (misal "4.8")
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type TherapistMonthlyReport = typeof therapistMonthlyReports.$inferSelect;
export type NewTherapistMonthlyReport = typeof therapistMonthlyReports.$inferInsert;

// ============================================
// INVOICES (Struk / Bukti Pembayaran)
// ============================================
export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(), // UUID unik
  invoiceNumber: text("invoice_number").notNull().unique(), // Format: INV-CABANG-YYYYMMDD-SEQ
  visitId: text("visit_id").references(() => patientVisits.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone").notNull(),
  therapistId: text("therapist_id").references(() => therapists.id),
  therapistName: text("therapist_name"),
  branchId: text("branch_id").notNull().references(() => branches.id),
  branchName: text("branch_name").notNull(),
  branchAddress: text("branch_address"),
  branchPhone: text("branch_phone"),
  // Item detail (JSON string untuk fleksibilitas multi-item)
  items: text("items").notNull(), // JSON: [{name, qty, price, subtotal}]
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  grandTotal: integer("grand_total").notNull(),
  paymentMethod: text("payment_method").notNull().default("CASH"),
  splitPayments: text("split_payments"), // JSON: [{method, amount}]
  amountPaid: integer("amount_paid").notNull().default(0),
  changeAmount: integer("change_amount").notNull().default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  branchIdx: index("invoice_branch_idx").on(table.branchId),
  dateIdx: index("invoice_date_idx").on(table.createdAt),
  therapistIdx: index("invoice_therapist_idx").on(table.therapistId),
}));

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

// ============================================
// STAFF (Pegawai Non-Terapis)
// ============================================
export const staff = pgTable("staff", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // "Admin", "CS", "Kebersihan", dsb
  phone: text("phone").notNull(),
  baseSalary: integer("base_salary").notNull().default(0),
  dailyAllowance: integer("daily_allowance").notNull().default(0), // Uang makan/transport
  branchId: text("branch_id").references(() => branches.id),
  isActive: boolean("is_active").notNull().default(true),
  joinedAt: text("joined_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;

// ============================================
// STAFF PAYROLL REPORTS (Slip Gaji Pegawai)
// ============================================
export const staffPayrollReports = pgTable("staff_payroll_reports", {
  id: text("id").primaryKey(), // Secure UUID
  staffId: text("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // Format YYYY-MM (misal "2026-06")
  attendancePresent: integer("attendance_present").notNull().default(0),
  attendanceLate: integer("attendance_late").notNull().default(0),
  attendanceAbsent: integer("attendance_absent").notNull().default(0),
  baseSalary: integer("base_salary").notNull().default(0),
  allowances: integer("allowances").notNull().default(0), // Uang makan/transport total
  bonuses: integer("bonuses").notNull().default(0), // THR atau bonus lain
  deductions: integer("deductions").notNull().default(0), // Kasbon, penalti
  takeHomePay: integer("take_home_pay").notNull().default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type StaffPayrollReport = typeof staffPayrollReports.$inferSelect;
export type NewStaffPayrollReport = typeof staffPayrollReports.$inferInsert;

// ============================================
// SYSTEM LOGS (Audit Trail)
// ============================================
export const systemLogs = pgTable("system_logs", {
  id: text("id").primaryKey(), // UUID
  userId: text("user_id").notNull(), // Bisa admin/cashier id
  userName: text("user_name").notNull(),
  action: text("action").notNull(), // e.g. "DELETE_INVOICE", "UPDATE_PRICE", "CANCEL_RESERVATION"
  entityType: text("entity_type").notNull(), // e.g. "invoice", "service", "reservation"
  entityId: text("entity_id").notNull(),
  details: text("details"), // JSON string info tambahan
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type SystemLog = typeof systemLogs.$inferSelect;
export type NewSystemLog = typeof systemLogs.$inferInsert;
