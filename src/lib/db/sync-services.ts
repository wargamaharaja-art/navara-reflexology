import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { services } from "./schema";
import { SERVICES_LIST, getServicePrice } from "../pricing";

async function syncServices() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const db = drizzle(client);

  console.log("Syncing services to database...");

  for (const service of SERVICES_LIST) {
    // We will use Karawaci's price as the baseline 'price' in the database.
    const basePrice = getServicePrice("karawaci", service.id) || 0;
    
    let duration = 60;
    if (service.category === "MCU") duration = 15;
    if (service.id.includes("sunnah")) duration = 30;
    if (service.id.includes("holistik")) duration = 40;
    if (service.id.includes("tradisional")) duration = 20;
    if (service.id.includes("estetika")) duration = 15;

    await db.insert(services).values({
      id: service.id,
      name: service.name,
      description: `Layanan ${service.name}`,
      price: basePrice,
      durationMinutes: duration,
      isActive: true,
    }).onConflictDoUpdate({
      target: services.id,
      set: {
        name: service.name,
        price: basePrice,
      }
    });
  }

  console.log("Services synced successfully!");
  client.close();
}

syncServices().catch(console.error);
