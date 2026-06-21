import pg from 'pg';
import * as fs from 'fs';

// Load environment variables manually from .env
const envLocal = fs.readFileSync('.env', 'utf-8');
const env: Record<string, string> = {};
envLocal.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
});

const dbUrl = env['DATABASE_URL'];
if (!dbUrl) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

const connectionString = dbUrl.replace('prisma+postgres://', 'postgres://');
console.log("Connecting to:", connectionString.split('?')[0] + "?api_key=...");

const client = new pg.Client({
  connectionString
});

async function main() {
  await client.connect();
  console.log("Connected successfully to PostgreSQL!");
  
  // Query all triggers
  console.log("\n=== TRIGGERS ===");
  const triggersRes = await client.query(`
    SELECT trigger_name, event_manipulation, event_object_table, action_statement
    FROM information_schema.triggers
    WHERE event_object_schema = 'public';
  `);
  for (const row of triggersRes.rows) {
    console.log(row);
  }

  // Query function definitions
  console.log("\n=== FUNCTIONS ===");
  const funcsRes = await client.query(`
    SELECT p.proname, pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname IN ('fn_apply_attempt', 'fn_detect_root_flaws', 'fn_generate_weakness_report');
  `);
  for (const row of funcsRes.rows) {
    console.log(`\n=========================================\nFunction ${row.proname}:\n=========================================`);
    console.log(row.definition);
  }
}

main()
  .catch(console.error)
  .finally(() => client.end());
