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

async function runTest() {
  console.log('=== Starting Time Trap Verification ===')

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
  console.log(`Concept ${conceptId} has questions:`, questionIds)

  // 2. Clean up previous attempts on these questions for test purposes
  console.log('Cleaning up previous attempts...')
  await supabase.from('attempts').delete().in('question_id', questionIds)
  await supabase.from('concept_mastery').delete().eq('concept_id', conceptId)
  await supabase.from('weakness_signals').delete().eq('concept_id', conceptId)

  // 3. Insert mock attempts for global average: 100 attempts from other users with average time of 45s (45000ms)
  console.log('Inserting mock attempts for other users to set global average to 45s...')
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
  const { error: gError } = await supabase.from('attempts').insert(globalAttempts)
  if (gError) console.error('Error inserting global attempts:', gError)

  // 4. Insert 11 attempts for testUserId with average time of 140s (140000ms) and low accuracy
  console.log('Inserting 11 attempts for test user with average time of 140s (accuracy ~36%)...')
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

  // Insert first 10
  const { error: sError1 } = await supabase.from('attempts').insert(studentAttempts.slice(0, 10))
  if (sError1) console.error('Error inserting student attempts:', sError1)

  // Run update on the 10th attempt to trigger calculation
  await updateConceptMastery(supabase, testUserId, questionIds[9 % questionIds.length])

  // Insert the 11th attempt to trigger time trap detection
  console.log('Inserting the 11th attempt to trigger time trap detection...')
  const { error: sError2 } = await supabase.from('attempts').insert(studentAttempts[10])
  if (sError2) console.error('Error inserting 11th student attempt:', sError2)

  await updateConceptMastery(supabase, testUserId, questionIds[10 % questionIds.length])

  // 5. Query and verify concept_mastery and weakness_signals
  const { data: mastery } = await supabase
    .from('concept_mastery')
    .select('*')
    .eq('user_id', testUserId)
    .eq('concept_id', conceptId)
    .single()

  console.log('\n--- Calculated Concept Mastery ---')
  console.log(mastery)

  const { data: signals } = await supabase
    .from('weakness_signals')
    .select('*')
    .eq('user_id', testUserId)
    .eq('concept_id', conceptId)

  console.log('\n--- Generated Weakness Signals ---')
  console.log(signals)

  // 6. Test Auto Resolution: Insert 10 fast correct attempts for test user
  console.log('\nInserting 10 fast correct attempts (45s each) to improve performance and resolve time trap...')
  const fastAttempts = []
  for (let i = 0; i < 10; i++) {
    fastAttempts.push({
      user_id: testUserId,
      question_id: questionIds[i % questionIds.length],
      session_id: '88888',
      selected_option: 'A',
      is_correct: true, // improve accuracy
      time_taken_ms: 45000, // reduce average time to ~95s (ratio ~2.1 < 2.5 but still >= 2, so let's make it even faster to drop below 2)
      attempt_order: 2,
      created_at: new Date().toISOString()
    })
  }
  // Let's make average time even faster so ratio drops < 2
  for (const a of fastAttempts) {
    a.time_taken_ms = 30000 // 30s
  }
  await supabase.from('attempts').insert(fastAttempts)

  // Trigger update
  await updateConceptMastery(supabase, testUserId, questionIds[0])

  // Check signals again
  const { data: resolvedSignals } = await supabase
    .from('weakness_signals')
    .select('*')
    .eq('user_id', testUserId)
    .eq('concept_id', conceptId)

  console.log('\n--- Weakness Signals After Resolution ---')
  console.log(resolvedSignals)
}

runTest().catch(console.error)
