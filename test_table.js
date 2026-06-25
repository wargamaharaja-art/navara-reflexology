require('dotenv').config({ path: '.env.local' });
const { createClient } = require("@libsql/client");

async function run() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  try {
    const res = await client.execute("SELECT * FROM company_profile LIMIT 1");
    console.log("company_profile:", res.rows);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
run();
