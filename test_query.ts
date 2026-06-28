import { db } from "./src/lib/db/index";
import { settings } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  try {
    const result = await db.select().from(settings).where(eq(settings.id, "company_info")).limit(1);
    console.log("Success:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}
main();
