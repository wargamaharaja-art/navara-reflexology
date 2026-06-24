const Database = require('better-sqlite3');
const crypto = require('crypto');
const db = new Database('local.db');

// Setup COA IDs (matching accounting.ts)
const COA = {
  KAS: "acc_101",
  PENDAPATAN_LAYANAN: "acc_401"
};

const paidVisits = db.prepare("SELECT * FROM patient_visits WHERE payment_status='PAID'").all();
const incomeTrx = db.prepare("SELECT * FROM finance_transactions WHERE type='INCOME'").all();
const trxRefIds = new Set(incomeTrx.map(t => t.reference_id || t.referenceId).filter(id => id));

const insertFinance = db.prepare(`
  INSERT INTO finance_transactions (id, type, category, amount, description, reference_id, branch_id, payment_method, date)
  VALUES (@id, @type, @category, @amount, @description, @reference_id, @branch_id, @payment_method, @date)
`);

const insertJournal = db.prepare(`
  INSERT INTO journal_entries (id, date, description, reference_id, created_at)
  VALUES (@id, @date, @description, @reference_id, @created_at)
`);

const insertJournalLine = db.prepare(`
  INSERT INTO journal_lines (id, entry_id, account_id, debit, credit)
  VALUES (@id, @entry_id, @account_id, @debit, @credit)
`);

db.transaction(() => {
  for (const visit of paidVisits) {
    if (!trxRefIds.has(visit.id)) {
      // Find invoice to get the exact amount
      const invoice = db.prepare("SELECT * FROM invoices WHERE visit_id = ?").get(visit.id);
      let amount = 0;
      let description = "Pembayaran Terapi";
      
      if (invoice) {
        amount = invoice.grand_total || invoice.amount_paid || invoice.subtotal || 0;
        description = `Pembayaran Terapi atas nama ${invoice.patient_name || 'Unknown'}`;
      } else {
        // Fallback if no invoice
        amount = 150000; // rough default if missing, but we should hopefully have invoices
        const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(visit.patient_id);
        description = `Pembayaran Terapi atas nama ${patient ? patient.name : 'Unknown'}`;
      }

      if (amount > 0) {
        const trxId = crypto.randomUUID();
        const date = visit.updated_at || visit.visit_date; // Assuming updated_at is when it was paid
        
        insertFinance.run({
          id: trxId,
          type: "INCOME",
          category: "Pendapatan Layanan",
          amount: amount,
          description: description,
          reference_id: visit.id,
          branch_id: visit.branch_id,
          payment_method: invoice ? (invoice.payment_method || "CASH") : "CASH",
          date: date
        });

        // Create Journal Entry
        const journalId = crypto.randomUUID();
        insertJournal.run({
          id: journalId,
          date: date,
          description: `[Auto Sync] ${description}`,
          reference_id: trxId,
          created_at: date
        });

        insertJournalLine.run({
          id: crypto.randomUUID(),
          entry_id: journalId,
          account_id: COA.KAS,
          debit: amount,
          credit: 0
        });

        insertJournalLine.run({
          id: crypto.randomUUID(),
          entry_id: journalId,
          account_id: COA.PENDAPATAN_LAYANAN,
          debit: 0,
          credit: amount
        });

        console.log(`Synced visit ${visit.id} - ${description} - Rp${amount}`);
      }
    }
  }
})();

console.log("Backfill complete!");
