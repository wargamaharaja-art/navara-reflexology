import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './src/lib/db';
import { invoices } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const invs = await db.select().from(invoices).where(eq(invoices.visitId, 'V-1784212691818-9816'));
  console.log(JSON.stringify(invs, null, 2));
  process.exit(0);
}
main();
