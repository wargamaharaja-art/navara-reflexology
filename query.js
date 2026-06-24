const { createClient } = require("@libsql/client");

async function run() {
  const client = createClient({
    url: "file:local.db"
  });

  const res = await client.execute("SELECT id, name FROM services");
  console.log(res.rows);
}
run();
