import pg from 'pg'
import * as fs from 'fs'

// Load environment variables manually
const envLocal = fs.readFileSync('.env', 'utf-8')
const env: Record<string, string> = {}
envLocal.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startswith && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=')
    if (idx > -1) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
      env[key] = val
    }
  }
})

const dbUrl = env['DATABASE_URL']
if (!dbUrl) {
  console.error("DATABASE_URL not found in .env. Parsed keys:", Object.keys(env))
  process.exit(1)
}

// Convert prisma+postgres:// to postgres://
const connectionString = dbUrl.replace('prisma+postgres://', 'postgres://')
console.log("Connecting to:", connectionString.split('?')[0] + "?api_key=...")

const client = new pg.Client({
  connectionString
})

async function main() {
  await client.connect()
  console.log("Connected successfully to PostgreSQL proxy!")
  
  const query = `
    SELECT p.proname, pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname IN ('fn_detect_root_flaws', 'fn_generate_weakness_report');
  `
  
  const res = await client.query(query)
  for (const row of res.rows) {
    console.log(`\n=========================================\nFunction ${row.proname}:\n=========================================`)
    console.log(row.definition)
  }
}

main()
  .catch(console.error)
  .finally(() => client.end())
