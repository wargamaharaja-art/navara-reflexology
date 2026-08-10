import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "./src/lib/db";
import { branches } from "./src/lib/db/schema";

async function main() {
  const result = await db.select().from(branches);
  console.log(result.map(b => ({ id: b.id, name: b.name, mapUrl: b.mapUrl })));
}

main().catch(console.error);
