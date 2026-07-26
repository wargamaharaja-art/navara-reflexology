const { db } = require("./src/lib/db");
const { invoices } = require("./src/lib/db/schema");

async function main() {
  const all = await db.select().from(invoices);
  let bad = 0;
  all.forEach(i => {
    try {
      if(typeof i.items === 'string') JSON.parse(i.items);
    } catch(e){
      bad++;
      console.log('bad item:', i.items);
    }
  });
  console.log('Total bad JSON in items:', bad);
  
  // also check splitPayments
  let badSplit = 0;
  all.forEach(i => {
    try {
      if(typeof i.splitPayments === 'string' && i.splitPayments) JSON.parse(i.splitPayments);
    } catch(e){
      badSplit++;
      console.log('bad splitPayments:', i.splitPayments);
    }
  });
  console.log('Total bad JSON in splitPayments:', badSplit);

  // check if any patientName is null
  let badName = all.filter(i => !i.patientName).length;
  console.log('Total null patientNames:', badName);
}
main().catch(console.error);
