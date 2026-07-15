import { db } from "./src/lib/db";
import { accounts } from "./src/lib/db/schema";

async function main() {
  const allAccounts = await db.select().from(accounts);
  console.log("Accounts in DB:", allAccounts.map(a => a.id));
  process.exit(0);
}

main().catch(console.error);
