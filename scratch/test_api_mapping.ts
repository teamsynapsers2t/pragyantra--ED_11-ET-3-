import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const TEST_USER_UUID = "d0000000-0000-0000-0000-000000000123"

async function run() {
  console.log("Fetching weakness signals for test user...")
  const { data: dbSignals, error: signalsError } = await supabase
    .from('weakness_signals')
    .select('*')
    .eq('user_id', TEST_USER_UUID)

  if (signalsError) {
    console.error("Error fetching signals:", signalsError)
    return
  }

  console.log(`Fetched ${dbSignals?.length} signals.`)

  // Fetch concepts
  const { data: concepts } = await supabase
    .from('concepts')
    .select('id, concept_name')

  const conceptMap: { [id: number]: string } = {}
  concepts?.forEach((c: any) => {
    conceptMap[c.id] = c.concept_name || "Unknown Concept"
  })

  // Fetch mastery
  const { data: masteryData } = await supabase
    .from('concept_mastery')
    .select('concept_id, mastery_score, total_attempts, total_correct')
    .eq('user_id', TEST_USER_UUID)

  const masteryMap: { [conceptId: number]: { mastery_score: number; total_attempts: number; total_correct: number } } = {}
  masteryData?.forEach((m: any) => {
    masteryMap[m.concept_id] = {
      mastery_score: m.mastery_score,
      total_attempts: m.total_attempts,
      total_correct: m.total_correct,
    }
  })

  // Apply mapping logic
  const signals = dbSignals.flatMap((s: any) => {
    let evidenceObj: Record<string, any> = {}
    if (s.evidence) {
      if (typeof s.evidence === 'string') {
        try {
          evidenceObj = JSON.parse(s.evidence)
        } catch (e) {
          console.error("[API Weakness] Failed to parse evidence string:", e)
        }
      } else {
        evidenceObj = s.evidence
      }
    }

    if (s.signal !== 'root_flaw') {
      const rawConceptName = conceptMap[s.concept_id] || "Unknown Concept"
      const cleanConceptName = rawConceptName
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      let insightMessage = "You spend significantly longer than expected on this concept."
      if (s.signal === 'time_trap') {
        const timeRatio = evidenceObj.time_ratio || 1.0
        insightMessage = `You spend ${parseFloat(String(timeRatio)).toFixed(1)}× longer than average students on ${cleanConceptName} questions.`
      }

      const conceptMastery = masteryMap[s.concept_id]

      return [{
        id: s.id,
        conceptId: s.concept_id,
        conceptName: rawConceptName,
        signal: s.signal,
        severity: (s.severity || 'medium').toLowerCase(),
        severityScore: s.severity_score,
        confidenceScore: s.confidence_score,
        evidence: evidenceObj,
        insightMessage,
        createdAt: s.created_at,
        masteryScore: conceptMastery?.mastery_score ?? null,
        totalAttempts: conceptMastery?.total_attempts ?? 0,
        totalCorrect: conceptMastery?.total_correct ?? 0,
        dominantErrorType: evidenceObj.dominant_error_type || null,
      }]
    }

    // Handle root_flaw by generating one signal per child in explains array
    const parentId = s.concept_id
    const parentName = conceptMap[parentId] || `Concept #${parentId}`
    const parentMasteryRecord = masteryMap[parentId]
    const parentMastery = parentMasteryRecord ? Math.round(parentMasteryRecord.mastery_score * 100) : 0

    const explains = evidenceObj.explains || []
    if (explains.length === 0) {
      return []
    }

    return explains.map((child: any) => {
      const childId = child.concept_id
      const strength = child.strength || 8
      const childName = conceptMap[childId] || `Concept #${childId}`
      const childMasteryRecord = masteryMap[childId]
      const childMastery = childMasteryRecord ? Math.round(childMasteryRecord.mastery_score * 100) : 0

      const rootFlawScore = (100 - parentMastery) * strength

      const mappedEvidence = {
        root_concept_id: parentId,
        root_concept_name: parentName,
        weak_concept_id: childId,
        weak_concept_name: childName,
        root_mastery: parentMastery,
        weak_mastery: childMastery,
        relationship_strength: strength,
        root_flaw_score: rootFlawScore
      }

      const cleanParent = parentName
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      const cleanChild = childName
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      let insightMessage = `Your actual problem is ${cleanParent}.\n\n${cleanChild} is suffering because your foundation in ${cleanParent} is weak.`
      if (cleanChild.toLowerCase().includes("projectile motion") && cleanParent.toLowerCase().includes("vector")) {
        insightMessage = "Your actual problem is Vector Addition.\n\nProjectile Motion is suffering because your vector fundamentals are weak."
      } else if (cleanChild.toLowerCase().includes("electric potential") && cleanParent.toLowerCase().includes("electric field")) {
        insightMessage = "Your actual problem is Electric Field.\n\nYour understanding of Electric Potential is limited because Electric Field concepts are weak."
      }

      return {
        id: `${s.id}-${childId}`,
        conceptId: childId,
        conceptName: childName,
        signal: 'root_flaw',
        severity: (s.severity || 'medium').toLowerCase(),
        severityScore: s.severity_score,
        confidenceScore: s.confidence_score,
        evidence: mappedEvidence,
        insightMessage,
        createdAt: s.created_at,
        masteryScore: childMasteryRecord?.mastery_score ?? null,
        totalAttempts: childMasteryRecord?.total_attempts ?? 0,
        totalCorrect: childMasteryRecord?.total_correct ?? 0,
        dominantErrorType: null,
      }
    })
  })

  console.log("\nMapped Signals Result:")
  console.log(JSON.stringify(signals, null, 2))
}

run().catch(console.error)
