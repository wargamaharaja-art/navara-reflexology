import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || "postgres://postgres:postgres@localhost:5432/navara",
  ssl: process.env.POSTGRES_URL?.includes("localhost") ? false : { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });
