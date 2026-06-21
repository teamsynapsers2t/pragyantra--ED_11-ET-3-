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
  datasourceUrl: process.env.DATABASE_URL
})

async function main() {
  console.log("--- Querying question_options columns ---")
  try {
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'question_options';
    `)
    console.log(columns)
  } catch (err) {
    console.error("Error querying columns:", err)
  }

  console.log("\n--- Querying fn_apply_attempt definition ---")
  try {
    const functions = await prisma.$queryRawUnsafe(`
      SELECT routine_definition 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'fn_apply_attempt';
    `)
    if (Array.isArray(functions) && functions.length > 0) {
      console.log(functions[0].routine_definition)
    } else {
      console.log("Function not found in routines.")
    }
  } catch (err) {
    console.error("Error querying function:", err)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
