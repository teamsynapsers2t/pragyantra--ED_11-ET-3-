import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkIdToUuid } from '@/utils/helpers'
import { createServiceClient } from '@/utils/supabase/service'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const supabase = createServiceClient()
    const userUuid = clerkIdToUuid(userId)

    // 1. Fetch weakness signals for this user
    const { data: dbSignals, error: signalsError } = await supabase
      .from('weakness_signals')
      .select('*')
      .eq('user_id', userUuid)

    if (signalsError) {
      console.error("[API Weakness] Error fetching weakness signals:", signalsError)
      return NextResponse.json({ error: signalsError.message }, { status: 500 })
    }

    if (!dbSignals || dbSignals.length === 0) {
      return NextResponse.json({ signals: [], mastery: [], report: null })
    }

    // 2. Fetch all concepts to map concept IDs to concept names
    const { data: concepts, error: conceptsError } = await supabase
      .from('concepts')
      .select('id, concept_name')

    if (conceptsError) {
      console.error("[API Weakness] Error fetching concepts for mapping:", conceptsError)
    }

    const conceptMap: { [id: number]: string } = {}
    concepts?.forEach((c: any) => {
      conceptMap[c.id] = c.concept_name || "Unknown Concept"
    })

    // 3. Fetch concept mastery for this user (for mastery percentages)
    const { data: masteryData } = await supabase
      .from('concept_mastery')
      .select('concept_id, mastery_score, total_attempts, total_correct')
      .eq('user_id', userUuid)

    const masteryMap: { [conceptId: number]: { mastery_score: number; total_attempts: number; total_correct: number } } = {}
    masteryData?.forEach((m: any) => {
      masteryMap[m.concept_id] = {
        mastery_score: m.mastery_score,
        total_attempts: m.total_attempts,
        total_correct: m.total_correct,
      }
    })

    // 4. Fetch latest weakness report
    const { data: reportData } = await supabase
      .from('weakness_reports')
      .select('report_text, generated_at')
      .eq('user_id', userUuid)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 5. Map database signals to clean UI signals
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
          severity: (s.severity || 'medium').toLowerCase(), // Normalize to lowercase
          severityScore: s.severity_score,
          confidenceScore: s.confidence_score,
          evidence: evidenceObj,
          insightMessage,
          createdAt: s.created_at,
          // Mastery data
          masteryScore: conceptMastery?.mastery_score != null ? Math.round(conceptMastery.mastery_score * 100) : null,
          totalAttempts: conceptMastery?.total_attempts ?? 0,
          totalCorrect: conceptMastery?.total_correct ?? 0,
          // Error type from evidence
          dominantErrorType: evidenceObj.dominant_error_type || null,
        }]
      }

      // Handle root_flaw signals (NEW FORMAT: child-centric, stored under child concept_id)
      // evidence = { root_concept_id, root_concept_name, root_mastery, relationship_strength, root_flaw_score }
      const childId = s.concept_id
      const childName = conceptMap[childId] || `Concept #${childId}`
      const childMasteryRecord = masteryMap[childId]
      const childMastery = childMasteryRecord ? Math.round(childMasteryRecord.mastery_score * 100) : 0

      // Read root cause info from evidence (new flat format)
      const rootConceptId = evidenceObj.root_concept_id
      const rootConceptName = evidenceObj.root_concept_name || (rootConceptId ? conceptMap[rootConceptId] || `Concept #${rootConceptId}` : 'Parent Concept')
      const rootMasteryRaw = evidenceObj.root_mastery ?? (rootConceptId ? (masteryMap[rootConceptId]?.mastery_score ?? 0) : 0)
      const rootMastery = Math.round(rootMasteryRaw * 100)
      const strength = evidenceObj.relationship_strength || 8
      const rootFlawScore = evidenceObj.root_flaw_score || ((100 - rootMastery) * strength)

      if (!rootConceptId) {
        return []
      }

      const mappedEvidence = {
        root_concept_id: rootConceptId,
        root_concept_name: rootConceptName,
        weak_concept_id: childId,
        weak_concept_name: childName,
        root_mastery: rootMastery,
        weak_mastery: childMastery,
        relationship_strength: strength,
        root_flaw_score: rootFlawScore
      }

      const cleanParent = rootConceptName
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      const cleanChild = childName
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      const insightMessage = `Your actual problem is ${cleanParent}.\n\n${cleanChild} is suffering because your foundation in ${cleanParent} is weak.`

      return [{
        id: s.id,
        conceptId: childId,
        conceptName: childName,
        signal: 'root_flaw',
        severity: (s.severity || 'medium').toLowerCase(),
        severityScore: s.severity_score,
        confidenceScore: s.confidence_score,
        evidence: mappedEvidence,
        insightMessage,
        createdAt: s.created_at,
        masteryScore: childMasteryRecord?.mastery_score != null ? Math.round(childMasteryRecord.mastery_score * 100) : null,
        totalAttempts: childMasteryRecord?.total_attempts ?? 0,
        totalCorrect: childMasteryRecord?.total_correct ?? 0,
        dominantErrorType: null,
      }]
    })

    return NextResponse.json({
      signals,
      report: reportData ? {
        text: reportData.report_text,
        generatedAt: reportData.generated_at,
      } : null,
    })

  } catch (err: any) {
    console.error("[API Weakness] Handler error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
