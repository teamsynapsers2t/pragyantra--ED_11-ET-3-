import { PrismaClient } from '../../generated/prisma/client'
import * as fs from 'fs'

// Load environment variables manually
const envLocal = fs.readFileSync('.env', 'utf-8')
envLocal.split('\n').forEach(line => {
  const parts = line.trim().split('=')
  if (parts.length === 2) {
    process.env[parts[0].trim()] = parts[1].trim().replace(/^["']|["']$/g, '')
  }
})

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {
  console.log("--- Querying fn_detect_root_flaws definition ---")
  try {
    const res = await prisma.$queryRawUnsafe<any[]>(`
      SELECT p.proname, pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname IN ('fn_detect_root_flaws', 'fn_generate_weakness_report');
    `)
    for (const r of res) {
      console.log(`\n=========================================\nFunction ${r.proname}:\n=========================================`)
      console.log(r.definition)
    }
  } catch (err) {
    console.error("Error querying function definitions:", err)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
