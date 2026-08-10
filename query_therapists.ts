import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("./src/lib/db");
  const { therapists } = await import("./src/lib/db/schema");
  const { like, or } = await import("drizzle-orm");
  const result = await db.select().from(therapists).where(
    or(
      like(therapists.name, "%Suci%"),
      like(therapists.name, "%Deni%"),
      like(therapists.name, "%Akbar%"),
      like(therapists.name, "%Rahmadani%")
    )
  );
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch(console.error);
