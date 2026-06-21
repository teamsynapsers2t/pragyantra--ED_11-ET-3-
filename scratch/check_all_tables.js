const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
  });
  try {
    await client.connect();
    console.log("Connected successfully to template1!");
    
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata;
    `);
    console.log("Schemas:", schemas.rows.map(r => r.schema_name));

    const tables = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema');
    `);
    console.log("Tables:", tables.rows.map(r => `${r.table_schema}.${r.table_name}`));
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
