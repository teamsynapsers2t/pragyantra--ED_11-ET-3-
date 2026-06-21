const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgres://postgres:postgres@localhost:51214/postgres?sslmode=disable"
  });
  try {
    await client.connect();
    console.log("Connected successfully to database 'postgres'!");
    
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log("Tables in public schema:", tablesRes.rows.map(r => r.table_name));

    const funRes = await client.query(`
      SELECT proname 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public';
    `);
    console.log("Functions in public schema:", funRes.rows.map(r => r.proname));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
