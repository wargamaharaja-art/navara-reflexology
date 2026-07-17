const db = require('better-sqlite3')('local.db');
const rows = db.prepare(`SELECT pv.id as visitId, pv.service_id, p.name FROM patient_visits pv JOIN patients p ON pv.patient_id = p.id WHERE p.name LIKE '%ela%'`).all();
console.log('Original visits:', rows);

// Also let's check invoices to find the right service ID
const invoices = db.prepare(`SELECT id, items FROM invoices WHERE patient_name LIKE '%ela%'`).all();
console.log('Invoices:', invoices);

// Update visit to match invoice
if (rows.length > 0 && invoices.length > 0) {
  const invoiceItems = JSON.parse(invoices[0].items);
  const correctServiceId = invoiceItems[0].serviceId || invoiceItems[0].name;
  db.prepare(`UPDATE patient_visits SET service_id = ? WHERE id = ?`).run(correctServiceId, rows[0].visitId);
  console.log(`Updated visit ${rows[0].visitId} to service ${correctServiceId}`);
}
