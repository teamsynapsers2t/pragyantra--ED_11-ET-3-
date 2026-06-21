import { createClient } from '@supabase/supabase-js'
import { updateConceptMastery } from '../utils/mastery'
import * as fs from 'fs'

// Load environment variables manually
const envLocal = fs.readFileSync('.env.local', 'utf-8')
const env: Record<string, string> = {}
envLocal.split('\n').forEach(line => {
  const parts = line.trim().split('=')
  if (parts.length === 2) {
    env[parts[0].trim()] = parts[1].trim().replace(/^["']|["']$/g, '')
  }
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

const supabase = createClient(supabaseUrl, supabaseKey)
const testUserId = '654d8d12-7b13-336b-ca41-462af94d0090'
const conceptId = 7 // Error of Measurement

async function triggerData() {
  console.log('=== Populating Active Time Trap Data ===')

  // 1. Find all question IDs for concept 7
  const { data: mappings } = await supabase
    .from('question_concepts')
    .select('question_id')
    .eq('concept_id', conceptId)

  if (!mappings || mappings.length === 0) {
    console.error('No question concepts found.')
    return
  }

  const questionIds = mappings.map(m => m.question_id)

  // 2. Clean up previous attempts on these questions for test purposes
  console.log('Cleaning up previous attempts...')
  await supabase.from('attempts').delete().in('question_id', questionIds)
  await supabase.from('concept_mastery').delete().eq('concept_id', conceptId)
  await supabase.from('weakness_signals').delete().eq('concept_id', conceptId)

  // 3. Insert mock attempts for global average: 100 attempts from other users with average time of 45s (45000ms)
  console.log('Inserting mock attempts for other users...')
  const globalAttempts = []
  for (let i = 0; i < 100; i++) {
    globalAttempts.push({
      user_id: 'a0000000-0000-0000-0000-000000000001',
      question_id: questionIds[i % questionIds.length],
      session_id: '12345',
      selected_option: 'A',
      is_correct: true,
      time_taken_ms: 45000,
      attempt_order: 1,
      created_at: new Date().toISOString()
    })
  }
  await supabase.from('attempts').insert(globalAttempts)

  // 4. Insert 11 attempts for testUserId with average time of 140s (140000ms) and low accuracy
  console.log('Inserting 11 attempts for test user...')
  const studentAttempts = []
  for (let i = 0; i < 11; i++) {
    studentAttempts.push({
      user_id: testUserId,
      question_id: questionIds[i % questionIds.length],
      session_id: '99999',
      selected_option: 'A',
      is_correct: i < 4, // 4 correct out of 11 = 36% accuracy
      time_taken_ms: 140000,
      attempt_order: 1,
      created_at: new Date().toISOString()
    })
  }

  await supabase.from('attempts').insert(studentAttempts)

  // Trigger update
  await updateConceptMastery(supabase, testUserId, questionIds[0])
  console.log('Active Time Trap signal has been successfully generated and left in the database.')
}

triggerData().catch(console.error)
