import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { branches } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function fix() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const db = drizzle(client);

  await db.update(branches).set({ mapUrl: "https://maps.google.com/maps?q=Radja+Bekam+Karawaci,+Tangerang&t=&z=15&ie=UTF8&iwloc=&output=embed" }).where(eq(branches.id, "karawaci"));
  await db.update(branches).set({ mapUrl: "https://maps.google.com/maps?q=Duren+Sawit,+Jakarta+Timur&t=&z=15&ie=UTF8&iwloc=&output=embed" }).where(eq(branches.id, "duren-sawit"));
  await db.update(branches).set({ mapUrl: "https://maps.google.com/maps?q=Mustika+Jaya,+Bekasi&t=&z=15&ie=UTF8&iwloc=&output=embed" }).where(eq(branches.id, "mustika-jaya"));

  console.log("✅ Fixed maps");
  client.close();
}

fix().catch(console.error);
