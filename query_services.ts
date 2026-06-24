import { db } from "./src/lib/db";
import { services } from "./src/lib/db/schema";

async function main() {
  const allServices = await db.select().from(services);
  console.log(JSON.stringify(allServices, null, 2));
}

main().catch(console.error);
