const Database = require('better-sqlite3');
const db = new Database('local.db');

const paidVisits = db.prepare("SELECT * FROM patient_visits WHERE payment_status='PAID'").all();
console.log("Total Paid Visits:", paidVisits.length);

const incomeTrx = db.prepare("SELECT * FROM finance_transactions WHERE type='INCOME'").all();
console.log("Total Income Transactions:", incomeTrx.length);

const trxRefIds = new Set(incomeTrx.map(t => t.reference_id || t.referenceId).filter(id => id));

let missingCount = 0;
for (const visit of paidVisits) {
    if (!trxRefIds.has(visit.id)) {
        missingCount++;
    }
}
console.log("Missing Finance Records for Paid Visits:", missingCount);

const invoices = db.prepare("SELECT * FROM invoices").all();
console.log("Total Invoices:", invoices.length);
