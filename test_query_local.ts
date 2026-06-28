import { db } from "./src/lib/db/index";
import { settings } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

const client = createClient({
  url: "file:local.db",
});
const localDb = drizzle(client);

async function main() {
  try {
    const result = await localDb.select().from(settings).where(eq(settings.id, "company_info")).limit(1);
    console.log("Success:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}
main();
