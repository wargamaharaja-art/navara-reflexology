require('dotenv').config({ path: '.env.local' });
const { createClient } = require("@libsql/client");

async function run() {
  try {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    const res = await client.execute("SELECT 1 AS ok");
    console.log("Turso Connection OK:", res.rows);
  } catch (err) {
    console.error("Turso Connection Error:", err);
  }
}
run();
