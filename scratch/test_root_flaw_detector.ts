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

const childConceptId = 7 // Error of Measurement
const parentConceptId = 6 // Dimensions

async function runTest() {
  console.log('=== Starting Root Flaw Engine Verification ===')

  // 1. Fetch questions for child concept (Projectile Motion)
  const { data: childMappings } = await supabase
    .from('question_concepts')
    .select('question_id')
    .eq('concept_id', childConceptId)

  if (!childMappings || childMappings.length === 0) {
    console.error(`No questions found for child concept ID ${childConceptId}`)
    return
  }
  const childQuestionIds = childMappings.map(m => m.question_id)
  console.log(`Child concept ${childConceptId} has questions:`, childQuestionIds)

  // 2. Fetch questions for parent concept (Vector Addition)
  const { data: parentMappings } = await supabase
    .from('question_concepts')
    .select('question_id')
    .eq('concept_id', parentConceptId)

  if (!parentMappings || parentMappings.length === 0) {
    console.error(`No questions found for parent concept ID ${parentConceptId}`)
    return
  }
  const parentQuestionIds = parentMappings.map(m => m.question_id)
  console.log(`Parent concept ${parentConceptId} has questions:`, parentQuestionIds)

  // 3. Clean up previous attempts/mastery/signals for testing
  console.log('Cleaning up old test data...')
  const allTestQuestionIds = [...childQuestionIds, ...parentQuestionIds]
  await supabase.from('attempts').delete().eq('user_id', testUserId).in('question_id', allTestQuestionIds)
  await supabase.from('concept_mastery').delete().eq('user_id', testUserId).in('concept_id', [childConceptId, parentConceptId])
  await supabase.from('weakness_signals').delete().eq('user_id', testUserId).in('concept_id', [childConceptId, parentConceptId])

  // 4. Check if prerequisites exist in concept_prerequisites table
  const { data: prereqs } = await supabase
    .from('concept_prerequisites')
    .select('*')
    .eq('concept_id', childConceptId)
    .eq('requires_concept_id', parentConceptId)

  if (!prereqs || prereqs.length === 0) {
    console.warn('\n[WARNING] concept_prerequisites does not contain relationship: 15 -> 2. Please seed the table first!\n')
    console.log('You can seed this by pasting the SQL in scratch/seed_prerequisites.sql into your Supabase SQL Editor.')
    return
  }
  console.log('Found prerequisite mapping in DB:', prereqs[0])

  // 5. Insert 10 mock attempts for parent concept (Vector Addition)
  // 2 correct out of 10 = 20% mastery, 50% confidence.
  console.log('\nInserting 10 attempts for parent concept (Vector Addition)...')
  const parentAttempts = []
  for (let i = 0; i < 10; i++) {
    parentAttempts.push({
      user_id: testUserId,
      question_id: parentQuestionIds[i % parentQuestionIds.length],
      session_id: '11111',
      selected_option: 'A',
      is_correct: i < 2, // 20% accuracy
      time_taken_ms: 10000,
      attempt_order: 1,
      created_at: new Date().toISOString()
    })
  }
  const { error: pError } = await supabase.from('attempts').insert(parentAttempts)
  if (pError) {
    console.error('Error inserting parent attempts:', pError)
    return
  }
  // Update parent concept mastery
  await updateConceptMastery(supabase, testUserId, parentQuestionIds[0])

  // 6. Insert 10 mock attempts for child concept (Projectile Motion)
  // 2 correct out of 10 = 20% mastery, 50% confidence.
  console.log('Inserting 10 attempts for child concept (Projectile Motion)...')
  const childAttempts = []
  for (let i = 0; i < 10; i++) {
    childAttempts.push({
      user_id: testUserId,
      question_id: childQuestionIds[i % childQuestionIds.length],
      session_id: '22222',
      selected_option: 'A',
      is_correct: i < 2, // 20% accuracy
      time_taken_ms: 10000,
      attempt_order: 1,
      created_at: new Date().toISOString()
    })
  }
  const { error: cError } = await supabase.from('attempts').insert(childAttempts)
  if (cError) {
    console.error('Error inserting child attempts:', cError)
    return
  }
  // Update child concept mastery (this will trigger detectRootFlaws)
  await updateConceptMastery(supabase, testUserId, childQuestionIds[0])

  // 7. Verify Root Flaw signal was generated
  const { data: signals } = await supabase
    .from('weakness_signals')
    .select('*')
    .eq('user_id', testUserId)
    .eq('concept_id', childConceptId)
    .eq('signal', 'root_flaw')

  console.log('\n--- Generated Root Flaw Signals ---')
  console.log(signals)

  if (signals && signals.length > 0) {
    console.log('SUCCESS: Root Flaw signal successfully generated!')
    console.log('Signal Details:', JSON.stringify(signals[0], null, 2))
  } else {
    console.error('FAILURE: Root Flaw signal was not generated.')
    return
  }

  // 8. Test Auto-Resolution: Let's make the parent concept strong.
  // We'll insert 10 correct attempts for the parent concept.
  // New accuracy: (2 + 10) / 20 = 60% mastery, which is >= 60.
  console.log('\nInserting 10 correct attempts for parent concept to improve parent mastery to 60%...')
  const strongParentAttempts = []
  for (let i = 0; i < 10; i++) {
    strongParentAttempts.push({
      user_id: testUserId,
      question_id: parentQuestionIds[i % parentQuestionIds.length],
      session_id: '33333',
      selected_option: 'A',
      is_correct: true, // all correct
      time_taken_ms: 10000,
      attempt_order: 2,
      created_at: new Date().toISOString()
    })
  }
  const { error: spError } = await supabase.from('attempts').insert(strongParentAttempts)
  if (spError) {
    console.error('Error inserting strong parent attempts:', spError)
    return
  }
  
  // Update parent concept mastery first, then child concept mastery (which runs detectRootFlaws)
  await updateConceptMastery(supabase, testUserId, parentQuestionIds[0])
  await updateConceptMastery(supabase, testUserId, childQuestionIds[0])

  // 9. Verify Root Flaw signal was resolved (deleted)
  const { data: resolvedSignals } = await supabase
    .from('weakness_signals')
    .select('*')
    .eq('user_id', testUserId)
    .eq('concept_id', childConceptId)
    .eq('signal', 'root_flaw')

  console.log('\n--- Root Flaw Signals After Parent Improvement (Auto Resolution) ---')
  console.log(resolvedSignals)

  if (resolvedSignals && resolvedSignals.length === 0) {
    console.log('SUCCESS: Root Flaw signal was successfully resolved and deleted!')
  } else {
    console.error('FAILURE: Root Flaw signal was not resolved.')
  }
}

runTest().catch(console.error)
