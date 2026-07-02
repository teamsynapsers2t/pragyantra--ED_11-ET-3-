import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkIdToUuid } from '@/utils/helpers'
import { createServiceClient } from '@/utils/supabase/service'
import {
  WEAK_THRESHOLD,
  sampleConfidence,
  findRoot,
  missingFoundations,
  type MasteryMap,
  type RequiresMap,
} from '@/utils/rootCause'
import { rateLimit, tooManyRequests } from '@/utils/rateLimit'
import { reportError } from '@/utils/reportError'

// POST /api/weakness/refresh
//
// ── ROOT CAUSE ENGINE v3 ──────────────────────────────────────────────────
// Rebuilds every weakness signal for the user from their ACTUAL practice data.
//
// Definitions
//   • A concept is WEAK if mastery < WEAK_THRESHOLD (JEE standard: 0.8).
//   • A concept is PRACTICED if total_attempts > 0.
//
// What the engine produces, per practiced-weak concept S:
//   1. weak_concept  — always emitted for S (the symptom).
//   2. root_flaw     — emitted when a DEEPER foundation is the real problem.
//                      Found by walking the prerequisite graph DOWNWARD through
//                      practiced-weak concepts (MULTI-HOP) and picking the
//                      weakest reachable foundation that is weaker than S.
//                      evidence.path holds the full chain S → … → root.
//   3. missing_foundation — emitted when S depends on a prerequisite the user
//                      has NEVER practiced. You can't fix S until you build
//                      that foundation first.
//
// Confidence is statistical: small samples are discounted with a smooth
//   saturation n/(n+k) instead of hitting 100% after a handful of attempts.
// ───────────────────────────────────────────────────────────────────────────

// WEAK_THRESHOLD, sampleConfidence, findRoot, missingFoundations all live in
// @/utils/rootCause (pure + unit-tested). This route handles I/O + persistence.

type MasteryRow = {
  concept_id: number
  mastery_score: number
  total_attempts: number
  total_correct: number
}

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    // Rebuilds every signal (full table delete+insert) — guard against hammering.
    // 30 / min comfortably covers page loads + the 10s auto-refresh interval.
    const rl = rateLimit('weakness-refresh', userId, 30, 60 * 1000)
    if (!rl.ok) return tooManyRequests(rl)

    const supabase = createServiceClient()
    const userUuid = clerkIdToUuid(userId)

    // 1. Mastery ONLY for concepts the user has actually attempted
    const { data: masteryRows, error: masteryErr } = await supabase
      .from('concept_mastery')
      .select('concept_id, mastery_score, total_attempts, total_correct')
      .eq('user_id', userUuid)
      .gt('total_attempts', 0)

    if (masteryErr || !masteryRows?.length) {
      return NextResponse.json({ ok: true, generated: 0 })
    }

    // 2. Prerequisite relationships
    const { data: prereqs } = await supabase
      .from('concept_prerequisites')
      .select('concept_id, requires_concept_id, relationship_strength')

    // 3. Concept names
    const { data: concepts } = await supabase
      .from('concepts')
      .select('id, concept_name')

    const conceptMap: Record<number, string> = {}
    concepts?.forEach((c: any) => { conceptMap[c.id] = c.concept_name })
    const nameOf = (id: number) => conceptMap[id] || `Concept #${id}`

    // requires[S] = prerequisites S depends on (edges to walk DOWNWARD toward roots)
    const requires: RequiresMap = {}
    // dependents[R] = concepts that depend on R (what fixing R unlocks)
    const dependents: Record<number, number[]> = {}
    prereqs?.forEach((p: any) => {
      ;(requires[p.concept_id] ||= []).push({
        rootId: p.requires_concept_id,
        strength: p.relationship_strength ?? 5,
      })
      ;(dependents[p.requires_concept_id] ||= []).push(p.concept_id)
    })

    // Mastery lookup for practiced concepts
    const M: MasteryMap = {}
    ;(masteryRows as MasteryRow[]).forEach((m) => {
      M[m.concept_id] = {
        mastery: m.mastery_score,
        attempts: m.total_attempts,
        correct: m.total_correct,
      }
    })

    const accuracyOf = (id: number) => {
      const d = M[id]
      return d && d.attempts > 0 ? Math.round((d.correct / d.attempts) * 100) : 0
    }
    const unlocksOf = (id: number) =>
      (dependents[id] || []).map(nameOf).filter(Boolean)

    const practicedWeak = (masteryRows as MasteryRow[]).filter(
      (m) => m.mastery_score < WEAK_THRESHOLD,
    )

    const toUpsert: any[] = []
    const now = new Date().toISOString()

    for (const m of practicedWeak) {
      const cid = m.concept_id
      const mastery = m.mastery_score
      const severityScore = Math.round((1 - mastery) * 100)
      const accuracy = accuracyOf(cid)
      const unlocks = unlocksOf(cid)

      // (1) weak_concept — always
      toUpsert.push({
        user_id: userUuid,
        concept_id: cid,
        signal: 'weak_concept',
        severity: severityScore >= 85 ? 'HIGH' : severityScore >= 55 ? 'MEDIUM' : 'LOW',
        severity_score: severityScore,
        confidence_score: sampleConfidence(m.total_attempts),
        evidence: {
          mastery_score: mastery,
          total_attempts: m.total_attempts,
          total_correct: m.total_correct,
          accuracy,
          unlocks,
        },
        created_at: now,
      })

      // (2) root_flaw — multi-hop search for the true foundation
      const root = findRoot(cid, mastery, requires, M)
      const deps = requires[cid] || []

      if (root) {
        const rid = root.id
        const r = M[rid]
        const gap = mastery - r.mastery
        const rootFlawScore = Math.round(gap * root.minStrength * 10)
        const hops = root.path.length - 1

        // Full chain as rich nodes (symptom → … → root)
        const path = root.path.map((id) => ({
          id,
          name: nameOf(id),
          mastery: Math.round((M[id]?.mastery ?? 0) * 100),
          attempts: M[id]?.attempts ?? 0,
          accuracy: accuracyOf(id),
        }))

        // Chain confidence = limited by the weakest-sampled link
        const minLinkAttempts = Math.min(
          ...root.path.map((id) => M[id]?.attempts ?? 0),
        )

        toUpsert.push({
          user_id: userUuid,
          concept_id: cid,
          signal: 'root_flaw',
          severity: rootFlawScore >= 5 ? 'HIGH' : 'MEDIUM',
          severity_score: rootFlawScore,
          confidence_score: sampleConfidence(minLinkAttempts, 6),
          evidence: {
            root_concept_id: rid,
            root_concept_name: nameOf(rid),
            root_mastery: r.mastery,
            root_attempts: r.attempts,
            root_correct: r.correct,
            root_accuracy: accuracyOf(rid),
            weak_concept_id: cid,
            weak_concept_name: nameOf(cid),
            weak_mastery: mastery,
            weak_attempts: m.total_attempts,
            weak_accuracy: accuracy,
            relationship_strength: root.minStrength,
            root_flaw_score: rootFlawScore,
            mastery_gap: gap,
            hops, // how many levels deep the root is (1 = direct prereq)
            path, // full chain S → … → root for multi-hop rendering
            unlocks: unlocksOf(rid),
          },
          created_at: now,
        })
      } else if (deps.length === 0) {
        // (2b) standalone root — practiced, weak, no prerequisites in graph
        toUpsert.push({
          user_id: userUuid,
          concept_id: cid,
          signal: 'root_flaw',
          severity: severityScore >= 85 ? 'HIGH' : 'MEDIUM',
          severity_score: severityScore,
          confidence_score: sampleConfidence(m.total_attempts),
          evidence: {
            root_concept_id: cid,
            root_concept_name: nameOf(cid),
            root_mastery: mastery,
            root_attempts: m.total_attempts,
            root_correct: m.total_correct,
            root_accuracy: accuracy,
            weak_concept_id: cid,
            weak_concept_name: nameOf(cid),
            weak_mastery: mastery,
            weak_attempts: m.total_attempts,
            relationship_strength: 10,
            root_flaw_score: severityScore,
            hops: 0,
            is_standalone_root: true,
            unlocks,
          },
          created_at: now,
        })
      }

      // (3) missing_foundation — depends on something never practiced
      const missing = missingFoundations(cid, requires, M)
      if (missing.length > 0) {
        // rank the strongest-linked missing foundation first
        missing.sort((a, b) => b.strength - a.strength)
        const top = missing[0]
        toUpsert.push({
          user_id: userUuid,
          concept_id: cid,
          signal: 'missing_foundation',
          severity: 'MEDIUM',
          severity_score: Math.round(severityScore * 0.9),
          confidence_score: sampleConfidence(m.total_attempts),
          evidence: {
            weak_concept_id: cid,
            weak_concept_name: nameOf(cid),
            weak_mastery: mastery,
            weak_attempts: m.total_attempts,
            weak_accuracy: accuracy,
            missing_concept_id: top.id,
            missing_concept_name: nameOf(top.id),
            missing_all: missing.map((x) => nameOf(x.id)),
            relationship_strength: top.strength,
          },
          created_at: now,
        })
      }
    }

    if (toUpsert.length === 0) return NextResponse.json({ ok: true, generated: 0 })

    // Clean slate: delete old signals, insert fresh ones
    await supabase.from('weakness_signals').delete().eq('user_id', userUuid)
    const { error: insertErr } = await supabase.from('weakness_signals').insert(toUpsert)

    if (insertErr) {
      console.error('[weakness/refresh] insert error:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    const counts = toUpsert.reduce((acc: Record<string, number>, s) => {
      acc[s.signal] = (acc[s.signal] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({ ok: true, generated: toUpsert.length, counts })
  } catch (err: any) {
    await reportError(err, { route: 'api/weakness/refresh' })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
