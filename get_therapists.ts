import { db } from "./src/lib/db";
import { therapists, branches } from "./src/lib/db/schema";
import { like, or } from "drizzle-orm";

async function run() {
  const t = await db.select().from(therapists).where(
    or(
      like(therapists.name, "%Deni%"),
      like(therapists.name, "%Suci%")
    )
  );
  console.log("Therapists:", t);
  
  const b = await db.select().from(branches);
  console.log("Branches:", b.map(x => ({ id: x.id, name: x.name })));
}

run().catch(console.error);
